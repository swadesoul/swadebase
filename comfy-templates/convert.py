#!/usr/bin/env python3
"""Swade Comfy template layer: turn an official ComfyUI editor workflow (UI format, subgraphs included) into the
API format Comfy Cloud runs, plus a binding map so the Video Router can set prompt/duration/size/seed per job.

Usage: convert.py <ui_workflow.json> <object_info.json> <manifest_entry.json> > out.json
Output: {"workflow": {...api...}, "bindings": {param: [[node_id, input_name], ...]}, "defaults": {param: value}}

Rules follow the ComfyUI frontend's graphToPrompt: widgets fill in object_info input order, seeds/primitives carry an
extra "control_after_generate" value, V3 dynamic combos nest as "parent.child", muted nodes (mode 2) are dropped,
bypassed nodes (mode 4) pass their matching input through, Reroute/Primitive/Note nodes are frontend-only.
"""
import json
import sys

FRONTEND_ONLY = {'Note', 'MarkdownNote', 'Reroute', 'PrimitiveNode'}
WIDGET_TYPES = {'INT', 'FLOAT', 'STRING', 'BOOLEAN', 'COMBO', 'COMFY_DYNAMICCOMBO_V3'}


def spec_inputs(oi, ctype):
    d = oi.get(ctype)
    if not d:
        raise SystemExit(f'node type not on Comfy Cloud: {ctype}')
    out = []
    for group in ('required', 'optional'):
        for name, spec in (d.get('input', {}).get(group) or {}).items():
            out.append((name, spec))
    return out


def is_widget(spec):
    t = spec[0]
    opts = spec[1] if len(spec) > 1 and isinstance(spec[1], dict) else {}
    if opts.get('forceInput'):
        return False
    if opts.get('widgetType') in WIDGET_TYPES:
        return True  # multi-type inputs such as "FLOAT,INT" declare their widget explicitly
    return isinstance(t, list) or t in WIDGET_TYPES or (isinstance(t, str) and ',' in t and all(x in WIDGET_TYPES for x in t.split(',')))


def has_control(name, spec):
    t = spec[0]
    opts = spec[1] if len(spec) > 1 and isinstance(spec[1], dict) else {}
    if opts.get('control_after_generate'):
        return True
    return t == 'INT' and name in ('seed', 'noise_seed')


def fill_widgets(oi, ctype, values):
    """Map a node's widgets_values onto input names (handles control values and V3 dynamic combos)."""
    res, vals, i = {}, list(values or []), 0

    def take():
        nonlocal i
        v = vals[i] if i < len(vals) else None
        i += 1
        return v

    def walk(items, prefix=''):
        nonlocal i
        for name, spec in items:
            if not is_widget(spec):
                continue
            v = take()
            if v is None:
                # Template saved before Comfy added this setting: use Comfy's own default (or first option).
                opts = spec[1] if len(spec) > 1 and isinstance(spec[1], dict) else {}
                if 'default' in opts:
                    v = opts['default']
                elif isinstance(spec[0], list) and spec[0]:
                    v = spec[0][0]
                elif opts.get('options'):
                    o = opts['options'][0]
                    v = o.get('key') if isinstance(o, dict) else o
            key = prefix + name
            if v is None:
                continue
            res[key] = v
            if spec[0] == 'COMFY_DYNAMICCOMBO_V3':
                opts = spec[1].get('options', []) if len(spec) > 1 else []
                chosen = next((o for o in opts if o.get('key') == v), None)
                if chosen:
                    sub = []
                    for g in ('required', 'optional'):
                        sub += list((chosen.get('inputs', {}).get(g) or {}).items()) if isinstance(chosen.get('inputs', {}).get(g), dict) else []
                    walk(sub, key + '.')
            elif has_control(name, spec):
                ctl = vals[i] if i < len(vals) else None
                if isinstance(ctl, str) and ctl in ('fixed', 'increment', 'decrement', 'randomize'):
                    i += 1
    walk(spec_inputs(oi, ctype))
    return res


def flatten(ui):
    """Inline subgraph instances. Returns nodes {id: node}, links {id: (src, slot, dst, dslot)}, sg_targets."""
    subgraphs = {s['id']: s for s in (ui.get('definitions') or {}).get('subgraphs', [])}
    nodes, links, sg_targets = {}, {}, {}

    def link_tuple(l):
        if isinstance(l, dict):
            return l['id'], l['origin_id'], l['origin_slot'], l['target_id'], l['target_slot']
        return l[0], l[1], l[2], l[3], l[4]

    for n in ui['nodes']:
        nodes[str(n['id'])] = n
    for l in ui.get('links', []):
        lid, s, ss, d, ds = link_tuple(l)
        links[str(lid)] = (str(s), ss, str(d), ds)

    for nid, inst in list(nodes.items()):
        sg = subgraphs.get(inst['type'])
        if not sg:
            continue
        pre = f'{nid}:'
        in_id, out_id = str(sg['inputNode']['id']), str(sg['outputNode']['id'])
        for n in sg['nodes']:
            nn = dict(n)
            nn['id'] = pre + str(n['id'])
            nodes[nn['id']] = nn
        # Values of the instance's promoted widgets, in subgraph-input order.
        widget_vals = list(inst.get('widgets_values') or [])
        inst_links = {i['name']: i.get('link') for i in inst.get('inputs', [])}
        sg_in, w = {}, 0
        for idx, si in enumerate(sg['inputs']):
            # Only widget-type subgraph inputs (text, numbers, toggles, dropdowns) own a slot in widgets_values.
            val = None
            if str(si.get('type')).upper() in ('STRING', 'INT', 'FLOAT', 'BOOLEAN', 'COMBO'):
                val = widget_vals[w] if w < len(widget_vals) else None
                w += 1
            sg_in[idx] = {'name': si['name'], 'value': val, 'link': inst_links.get(si['name'])}
        for l in sg['links']:
            lid, s, ss, d, ds = link_tuple(l)
            s, d = str(s), str(d)
            if s == in_id:
                src = sg_in[ss]
                tgt = (pre + d, ds)
                sg_targets.setdefault(f'{nid}:{src["name"]}', []).append(tgt)
                if src['link'] is not None:
                    o = links[str(src['link'])]
                    links[pre + str(lid)] = (o[0], o[1], tgt[0], tgt[1])
                else:
                    nodes[tgt[0]].setdefault('_const', {})[ds] = src['value']
            elif d == out_id:
                # Anything outside that used the instance's output now reads the inner node.
                for k, v in list(links.items()):
                    if v[0] == nid and v[1] == ds:
                        links[k] = (pre + s, ss, v[2], v[3])
            else:
                links[pre + str(lid)] = (pre + s, ss, pre + d, ds)
        del nodes[nid]
        for k in [k for k, v in links.items() if v[2] == nid]:
            del links[k]
    return nodes, links, sg_targets


def convert(ui, oi):
    nodes, links, sg_targets = flatten(ui)
    by_target = {(v[2], v[3]): (v[0], v[1]) for v in links.values()}

    def resolve(src, slot, seen=0):
        n = nodes.get(src)
        if n is None or seen > 50:
            return None
        if n['type'] == 'Reroute' or n.get('mode') == 4:
            # pass through the first linked input (bypass: the input with the matching type)
            for idx, inp in enumerate(n.get('inputs', [])):
                up = by_target.get((src, idx))
                if up and (n['type'] == 'Reroute' or inp.get('type') == (n.get('outputs') or [{}])[slot].get('type')):
                    return resolve(up[0], up[1], seen + 1)
            return None
        if n['type'] == 'PrimitiveNode':
            return ('const', (n.get('widgets_values') or [None])[0])
        if n.get('mode') == 2:
            return None
        return ('link', [src, slot])

    api, slot_names = {}, {}
    for nid, n in nodes.items():
        if n['type'] in FRONTEND_ONLY or n.get('mode') in (2, 4):
            continue
        ctype = n['type']
        inputs = fill_widgets(oi, ctype, n.get('widgets_values'))
        ui_inputs = n.get('inputs', [])
        for idx, inp in enumerate(ui_inputs):
            name = inp['name']
            up = by_target.get((nid, idx))
            if up:
                r = resolve(*up)
                if r is None:
                    inputs.pop(name, None)
                elif r[0] == 'const':
                    inputs[name] = r[1]
                else:
                    inputs[name] = r[1]
            if idx in n.get('_const', {}):
                inputs[name] = n['_const'][idx]
        slot_names[nid] = [i['name'] for i in ui_inputs]
        api[nid] = {'class_type': ctype, 'inputs': inputs}
    return api, sg_targets, slot_names


def main():
    ui = json.load(open(sys.argv[1]))
    oi = json.load(open(sys.argv[2]))
    manifest = json.load(open(sys.argv[3]))
    api, sg_targets, slot_names = convert(ui, oi)
    bindings, defaults = {}, {}
    for param, ref in manifest['params'].items():
        # ref "405:text" = subgraph instance 405, input "text"; ref "376.value" = node 376 input "value"
        if ref in sg_targets:
            bindings[param] = [[t[0], slot_names[t[0]][t[1]]] for t in sg_targets[ref] if t[0] in api]
        elif '.' in ref:
            nid, inp = ref.split('.', 1)
            bindings[param] = [[nid, inp]]
        else:
            raise SystemExit(f'binding {param} -> {ref} not found')
        if not bindings[param]:
            raise SystemExit(f'binding {param} -> {ref} reaches no node')
        n, i = bindings[param][0]
        defaults[param] = api[n]['inputs'].get(i)
    for k, v in manifest.get('set', {}).items():
        nid, inp = k.split('.', 1)
        api[nid]['inputs'][inp] = v
    print(json.dumps({'workflow': api, 'bindings': bindings, 'defaults': defaults}))


if __name__ == '__main__':
    main()
