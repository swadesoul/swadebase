import {fail,hasCredential} from './action-policy.mjs';
/** Build exact Git tree edits. Read callbacks must use the approved base commit. */
export async function buildRepositoryChanges(changes,{read,exists}){
 const tree=[],touched=new Set();
 for(const change of changes){
  for(const path of [change.path,...(change.to_path?[change.to_path]:[])]){
   if(touched.has(path))throw fail('conflicting_paths','Each path may appear in only one change.');
   touched.add(path);
  }
  if(change.kind==='create'){
   if(await exists(change.path))throw fail('stale_code','A file already exists at the new path.');
   tree.push({path:change.path,mode:'100644',type:'blob',content:change.content});continue;
  }
  const file=await read(change.path);
  if(file.blob_sha!==change.expected_blob_sha)throw fail('stale_code','The exact source file changed.');
  if(!['100644','100755'].includes(file.mode))throw fail('invalid_input','Only ordinary source files may change.');
  if(hasCredential(file.content))throw fail('sensitive_source','Source containing credentials cannot be changed through this tool.');
  if(change.kind==='move'){
   if(await exists(change.to_path))throw fail('stale_code','The destination already exists.');
   tree.push({path:change.path,mode:file.mode,type:'blob',sha:null},{path:change.to_path,mode:file.mode,type:'blob',sha:file.blob_sha});continue;
  }
  let content=file.content;
  for(const edit of change.edits){
   if(content.split(edit.old_text).length!==2)throw fail('patch_context_mismatch','Every edit must match exactly one source fragment.');
   content=content.replace(edit.old_text,edit.new_text);
  }
  if(content===file.content)throw fail('empty_change','The edit does not change the file.');
  tree.push({path:change.path,mode:file.mode,type:'blob',content});
 }
 return tree;
}
