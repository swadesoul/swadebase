import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
function context(){
 const nodes=new Map();const node=s=>{if(!nodes.has(s))nodes.set(s,{value:'',hidden:false,innerHTML:'',textContent:'',style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},querySelector(){return null;},showModal(){},close(){},scrollBy(){}});return nodes.get(s);};
 const document={querySelector:node,querySelectorAll:()=>[],documentElement:{scrollHeight:1200},getElementById:()=>null};
 const window={addEventListener(){},matchMedia:()=>({matches:true,addEventListener(){}}),scrollTo(){}};
 const c=vm.createContext({document,window,location:{hash:'',hostname:'assetmachine.live'},localStorage:{getItem:()=>null,setItem(){}},navigator:{},URL,Blob,FormData,Date,setTimeout,clearTimeout,innerHeight:900,scrollY:0,requestAnimationFrame:()=>0,fetch:async()=>({ok:true,json:async()=>({user:null})})});
 vm.runInContext(source,c);return c;
}
test('all starter guides produce source-linked educational exports in both levels',()=>{
 const c=context();const keys=vm.runInContext('Object.keys(guides)',c);assert.equal(keys.length,7);
 for(const level of ['plain','professional'])for(const slug of keys){vm.runInContext(`experience=${JSON.stringify(level)};current={case:{title:'PRIVATE_CASE_123',description:'PRIVATE_DOC_456'},review:{notes:'PRIVATE_LEGAL_789'}}`,c);const txt=vm.runInContext(`guideText(${JSON.stringify(slug)})`,c),svg=vm.runInContext(`guideCard(${JSON.stringify(slug)})`,c);assert.match(txt,/SOURCES/);assert.match(txt,/https:\/\//);assert.match(svg,/<svg/);assert.match(svg,/Education only/);assert.doesNotMatch(txt+svg,/PRIVATE_CASE_123|PRIVATE_DOC_456|PRIVATE_LEGAL_789/);}
});
test('action summary excludes private notes, unreleased drafts and report bodies',()=>{
 const c=context();vm.runInContext(`current={case:{title:'Allowed title',description:'Owner statement',status:'intake'},evidence:[{name:'file.txt',sha256:'abc',extraction_status:'complete',extracted_text:'PRIVATE_FULL_TEXT'}],findings:[{title:'Missing evidence',body:'Issuer confirmation pending',scope:'Checklist only',source_url:'https://example.com',created_at:'2026-11-03'}],review:{notes:'PRIVATE_NOTES',draft:'PRIVATE_DRAFT'},reports:[{body:'PRIVATE_REPORT_BODY'}]}`,c);
 const report=vm.runInContext('actionReport()',c);assert.match(report,/Owner statement/);assert.match(report,/Issuer confirmation pending/);assert.doesNotMatch(report,/PRIVATE_NOTES|PRIVATE_DRAFT|PRIVATE_FULL_TEXT|PRIVATE_REPORT_BODY/);assert.match(report,/not an attorney opinion/);
});
test('plain and professional views preserve the same evidence checklist',()=>{
 const c=context();vm.runInContext("showLearning('sblc')",c);const plain=vm.runInContext("document.querySelector('#learning-content').innerHTML",c);vm.runInContext("setExperience('professional');showLearning('sblc')",c);const professional=vm.runInContext("document.querySelector('#learning-content').innerHTML",c);assert.notEqual(plain,professional);for(const term of ['Issuing/advising bank','drawing conditions','institutional confirmation']){assert.ok(plain.includes(term));assert.ok(professional.includes(term));}
});

test("network choices retain valid selectable Ethereum markup",()=>{assert.match(source,/<option value="ethereum">Ethereum<\/option>/);assert.doesNotMatch(source,/<\/option\s+value=/);});
