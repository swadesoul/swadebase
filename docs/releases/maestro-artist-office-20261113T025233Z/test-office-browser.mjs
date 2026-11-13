import{chromium}from'/opt/swadebase-adapters/browser-workspace/node_modules/playwright-core/index.mjs';import assert from'node:assert/strict';import fs from'node:fs';
const root='/opt/work/maestro-office-20261113',id='11111111-1111-4111-8111-111111111111';
const browser=await chromium.launch({executablePath:'/snap/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});const checks=[],errors=[];
try{for(const width of[1440,820,390]){
 const page=await browser.newPage({viewport:{width,height:1000}});page.on('pageerror',e=>errors.push(e.message));
 let profile={tone:'Relaxed and confident',goals:'Build returning fans',story_opt_in:false,story_role:'New artist',story_notes:'',story_boundaries:'',onboarding_done:false},campaigns=[];
 await page.route('https://swadebase.cloud/**',r=>r.request().url().includes('auth-config.json')?r.fulfill({json:{url:'https://swadebase.cloud',publicKey:'fixture'},headers:{'access-control-allow-origin':'*'}}):r.fulfill({json:[],headers:{'access-control-allow-origin':'*'}}));
 await page.route('https://radio.2-25-74-73.sslip.io/**',r=>r.fulfill({json:{is_online:true,now_playing:{song:{title:'Fixture radio'}}},headers:{'access-control-allow-origin':'*'}}));
 await page.route('**/maestro-factory-api/artist-office',async r=>{const b=r.request().postDataJSON();let out={};
 if(b.action==='roster')out={artists:[{id,display_name:'Nevaborya',label_name:'SWADE FAM',status:'live'}]};
 if(b.action==='load')out={site:{id,display_name:'Nevaborya',label_name:'SWADE FAM',status:'live'},profile,campaigns,metrics:Object.fromEntries(campaigns.map(c=>[c.id,{arrivals:3,returning:1,responses:2,recent_responses:[{answer:'More soul music!',day:'2026-11-13'}]}]))};
 if(b.action==='profile'){profile={...profile,...b};out={profile};}
 if(b.action==='draft'){const c={id:'22222222-2222-4222-8222-222222222222',created_at:new Date().toISOString(),office_active:false,assets:{headline:'Discover Nevaborya',artist_name:'Nevaborya',share_text:'Come listen with me.',url:'https://swosting.com/artist/fixture'}};campaigns=[c];out={campaign:c};}
 if(b.action==='edit'){campaigns[0].assets={...campaigns[0].assets,headline:b.headline,share_text:b.share_text};out={campaign:campaigns[0]};}
 if(b.action==='approve'){campaigns[0].office_active=true;campaigns[0].share_token='a'.repeat(32);out={campaign:campaigns[0]};}
 if(b.action==='pause'){campaigns[0].office_active=false;out={campaign:campaigns[0]};}
 return r.fulfill({status:b.action==='draft'?201:200,json:out});});
 await page.goto('http://127.0.0.1:5213/office-fixture.html?artist='+id,{waitUntil:'networkidle'});
 await page.getByRole('heading',{name:'What are we working on today?'}).waitFor();
 await page.getByRole('button',{name:'Got it / skip introduction'}).click();
 await page.getByRole('button',{name:'My identity & goals',exact:true}).click();await page.getByLabel('My writing style').fill('Warm and funny');await page.getByRole('button',{name:'Save my preferences'}).click();await page.getByText('Your office preferences are saved.',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Join the story',exact:true}).click();await page.getByLabel('I want to be considered').check();await page.getByLabel('Topics to leave out').fill('Private family matters');await page.getByRole('button',{name:'Save story preferences'}).click();await page.getByText('Your office preferences are saved.',{exact:true}).waitFor();assert.equal(profile.story_opt_in,true);
 await page.getByRole('button',{name:'My desk',exact:true}).click();await page.getByLabel('Tell your office what you need').fill('Invite my fans this weekend.');await page.screenshot({path:root+'/office-'+width+'.png',fullPage:true});await page.getByRole('button',{name:'Prepare my campaign'}).click();await page.getByLabel('Message',{exact:true}).fill('Come listen with me and tell me your favorite song.');await page.getByRole('button',{name:'Save reviewed draft'}).click();await page.getByLabel('I reviewed the facts and message.').check();await page.getByRole('button',{name:'Activate invitation'}).click();await page.getByText('INVITATION ACTIVE',{exact:false}).waitFor();
 const down=page.waitForEvent('download');await page.getByRole('button',{name:'Download promo graphic'}).click();assert.equal((await down).suggestedFilename(),'maestro-promo-1080.svg');
 await page.getByRole('button',{name:'Fan results',exact:true}).click();await page.getByText('More soul music!',{exact:false}).waitFor();
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'overflow '+width);assert.equal(await page.locator('script[src*="lovable-badge"],#lovable-badge').count(),0);
 await page.getByRole('button',{name:'Label roster view'}).click();await page.getByRole('heading',{name:'Label Office.'}).waitFor();
 const connected=await page.locator('a[href*="office_artist="]').count();assert.ok(connected>=3);assert.ok(await page.locator('a[href="/artist-studio?id='+id+'"]').count());
 checks.push({width,preferences:true,storyConsent:true,draft:true,review:true,share:true,graphic:true,metrics:true,contextLinks:true,overflow:false});await page.close();
}assert.deepEqual(errors,[]);fs.writeFileSync(root+'/office-ui-report.json',JSON.stringify({checks,errors,identity:'fixtures',productionWrites:0},null,2));console.log('Office journeys passed at 1440/820/390; no production writes.');}finally{await browser.close();}
