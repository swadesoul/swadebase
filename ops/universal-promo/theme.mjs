const rgb=s=>{const n=String(s||'').match(/[\d.]+/g);return n?.length>=3?n.slice(0,3).map(Number):null;};
export function luminance(s){const c=rgb(s);if(!c)return null;const v=c.map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4;});return .2126*v[0]+.7152*v[1]+.0722*v[2];}
export function contrast(a,b){const x=luminance(a),y=luminance(b);if(x===null||y===null)return 0;return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
export function chooseTheme({ink,surface,accent,buttonInk}){
 if(luminance(ink)===null)ink='rgb(245, 245, 245)';
 const dark='rgb(12, 14, 20)',light='rgb(250, 250, 248)';
 if(!surface||contrast(ink,surface)<5)surface=contrast(ink,dark)>contrast(ink,light)?dark:light;
 if(contrast(ink,surface)<5)ink=contrast(dark,surface)>contrast(light,surface)?dark:light;
 if(!accent||contrast(accent,surface)<2.5)accent=ink;
 if(!buttonInk||contrast(buttonInk,accent)<4.5)buttonInk=contrast(dark,accent)>contrast(light,accent)?dark:light;
 return {ink,surface,accent,buttonInk};
}
