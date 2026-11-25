// ABAGALE-only ingress for the shared Stripe account. Raw-body signature is mandatory.
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.96.0";
const targets: Record<string,string> = {
  "stripe-webhook": "STRIPE_WEBHOOK",
  "stripe-universal-webhook": "STRIPE_UNIVERSAL_WEBHOOK",
  "stripe-webhook-training": "STRIPE_WEBHOOK_SECRET_TRAINING",
  "od-webhook": "STRIPE_OD_WEBHOOK",
  "store-webhook": "STRIPE_STORE_WEBHOOK_SECRET",
  "credit-purchase-webhook": "ABAGALE_CREDIT_WEBHOOK_SECRET",
  "krew-stripe-webhook": "ABAGALE_KREW_WEBHOOK_SECRET",
  "founding-pass-fulfill": "ABAGALE_FOUNDING_PASS_WEBHOOK_SECRET",
};
const reply = (body: unknown,status=200) => new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json"}});
const idOf = (v:any):string|null => typeof v==="string" ? v : v?.id ?? null;
export async function routeEvent(db:any,event:any,stripe?:any):Promise<string|null> {
  const obj=event.data?.object;
  if (!obj) return null;
  const md=obj.metadata ?? {};
  const exists=async(table:string,col:string,id:string|null) => {
    if (!id) return false;
    const {data,error}=await db.from(table).select("id").eq(col,id).limit(1);
    if(error) throw new Error("scope_lookup_failed");
    return !!data?.length;
  };
  if(event.type.startsWith("checkout.session.")) {
    // Stripe supplies this field. All legacy ABAGALE checkouts use this origin.
    let ownOrigin=false;
    try { ownOrigin=new URL(obj.success_url).hostname==="abagale.live"; } catch {}
    if(md.handler && ["training","universal","od"].includes(md.handler)) {
      const orderId=md.order_id ?? obj.client_reference_id;
      if(!orderId) return null;
      const {data,error}=await db.from("payment_orders").select("id,handler,stripe_checkout_session_id").eq("id",orderId).maybeSingle();
      if(error) throw new Error("scope_lookup_failed");
      if(!data || data.handler!==md.handler || data.stripe_checkout_session_id!==obj.id) return null;
      return md.handler==="training" ? "stripe-webhook-training" : md.handler==="od" ? "od-webhook" : "stripe-universal-webhook";
    }
    if(await exists("merch_orders","stripe_session_id",obj.id)) return "store-webhook";
    // Abagale TV 2027 Founding Pass Payment Link (one-time). Routed before the origin/app check (2026-11-24).
    if(md.offer==="founding_pass_2027" && (md.app==="abagale" || md.brand==="abagale") && obj.mode==="payment") return "founding-pass-fulfill";
    if(!ownOrigin && md.app!=="abagale") return null;
    if(md.krew_deployment_id && await exists("krew_deployments","id",md.krew_deployment_id)) return "krew-stripe-webhook";
    if(md.type==="credit_pack_purchase" && await exists("workspaces","id",md.workspace_id)) return "credit-purchase-webhook";
    if(md.booking_type==="frontpage" || md.purchase_type==="addon" || ["master","standalone"].includes(md.plan_type)) {
      return await exists("workspaces","id",md.workspace_id) ? "stripe-webhook" : null;
    }
    if(md.tier && md.user_id && await exists("workspaces","owner_user_id",md.user_id)) return "stripe-webhook";
    return null;
  }
  const subId=event.type.startsWith("customer.subscription.") ? obj.id
    : idOf(obj.subscription) ?? idOf(obj.parent?.subscription_details?.subscription);
  let piId=idOf(obj.payment_intent);
  if (!piId && event.type.startsWith("charge.dispute.") && idOf(obj.charge) && stripe) {
    const charge=await stripe.charges.retrieve(idOf(obj.charge)); piId=idOf(charge.payment_intent);
  }
  if(subId || piId) {
    const {data,error}=await db.from("payment_orders").select("handler").eq(subId?"stripe_subscription_id":"stripe_payment_intent_id",subId ?? piId).limit(1);
    if(error) throw new Error("scope_lookup_failed");
    const h=data?.[0]?.handler;
    if(["training","universal","od"].includes(h)) return h==="training" ? "stripe-webhook-training" : h==="od" ? "od-webhook" : "stripe-universal-webhook";
    if(subId && ["invoice.paid","customer.subscription.deleted"].includes(event.type)
      && await exists("subscriptions","stripe_subscription_id",subId)) return "stripe-webhook";
  }
  // Founding Pass refunds/disputes: the pass row stores its payment intent (2026-11-24).
  // A missing table (an older database) must not block the other handlers, so a lookup error means "not a pass".
  if(piId && ["charge.refunded","charge.dispute.created","charge.dispute.closed"].includes(event.type)
    && await exists("founding_passes","stripe_payment_intent_id",piId).catch(()=>false)) return "founding-pass-fulfill";
  // Credit-pack adjustments use the same authoritative Checkout/PI binding.
  // This also routes a refund that arrives before the purchase webhook.
  if(piId && stripe && ["charge.refunded","charge.dispute.created","charge.dispute.funds_withdrawn","charge.dispute.closed"].includes(event.type)) {
    const sessions=await stripe.checkout.sessions.list({payment_intent:piId,limit:2});
    if(sessions.has_more || sessions.data.length!==1) return null;
    const s=sessions.data[0]; let ownOrigin=false;
    try {ownOrigin=new URL(s.success_url).hostname==="abagale.live";} catch {}
    if(s.metadata?.type==="credit_pack_purchase" && (ownOrigin || s.metadata?.app==="abagale")
      && await exists("workspaces","id",s.metadata?.workspace_id)) return "credit-purchase-webhook";
  }
  return null;
}
export async function stripeSignature(raw:string,secret:string,t:number):Promise<string> {
  const enc=new TextEncoder();
  const key=await crypto.subtle.importKey("raw",enc.encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  const mac=await crypto.subtle.sign("HMAC",key,enc.encode(t+"."+raw));
  return "t="+t+",v1="+Array.from(new Uint8Array(mac)).map(b=>b.toString(16).padStart(2,"0")).join("");
}
Deno.serve(async req => {
  if(req.method!=="POST") return reply({error:"method_not_allowed"},405);
  const secret=Deno.env.get("ABAGALE_STRIPE_WEBHOOK_SECRET");
  const stripeKey=Deno.env.get("STRIPE_SECRET_KEY");
  if(!secret || !stripeKey) return reply({error:"misconfigured"},500);
  const sig=req.headers.get("stripe-signature");
  if(!sig) return reply({error:"missing_signature"},400);
  if(Number(req.headers.get("content-length") ?? 0)>2_000_000) return reply({error:"payload_too_large"},413);
  const raw=await req.text();
  if(raw.length>2_000_000) return reply({error:"payload_too_large"},413);
  let event:any;
  const stripe=new Stripe(stripeKey,{apiVersion:"2025-08-27.basil"});
  try {event=await stripe.webhooks.constructEventAsync(raw,sig,secret);} catch {return reply({error:"invalid_signature"},400);}
  const db=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,{auth:{persistSession:false}});
  let handler:string|null;
  try {handler=await routeEvent(db,event,stripe);} catch {return reply({error:"scope_lookup_failed"},500);}
  if(!handler) return reply({received:true,ignored:true});
  if(["checkout.session.completed","checkout.session.async_payment_succeeded"].includes(event.type)
    && !["paid","no_payment_required"].includes(event.data.object.payment_status)) return reply({received:true,unpaid:true});
  // Canonical handlers already claim and transact their own entitlement ledger.
  const legacy=["stripe-webhook","store-webhook","credit-purchase-webhook","krew-stripe-webhook","founding-pass-fulfill"].includes(handler);
  const claimId=legacy && ["checkout.session.completed","checkout.session.async_payment_succeeded"].includes(event.type)
    ? "checkout:"+event.data.object.id : event.id;
  let token:string|null=null;
  const rpc=async(name:string,args:any) => {const {data,error}=await db.rpc(name,args);if(error)throw new Error("ledger_failed");return data;};
  try {
    if(legacy) {
      const c=await rpc("stripe_webhook_claim",{p_event_id:claimId,p_type:event.type,p_livemode:event.livemode,
        p_payload:event,p_handler:"router:"+handler,p_handler_version:"v1",p_event_created:event.created,p_lease_seconds:120});
      const row=Array.isArray(c)?c[0]:c;
      if(row?.already_processed) return reply({received:true,duplicate:true});
      if(!row?.claimed || !row.claim_token) return reply({error:"busy"},409);
      token=row.claim_token;
    }
    const targetSecret=Deno.env.get(targets[handler]);
    if(!targetSecret) throw new Error("target_misconfigured");
    const targetRaw=JSON.stringify(event);
    const svc=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const res=await fetch("https://swadebase.cloud/app/abagale/functions/v1/"+handler,{
      method:"POST",headers:{"Content-Type":"application/json","stripe-signature":await stripeSignature(targetRaw,targetSecret,Math.floor(Date.now()/1000)),apikey:svc,Authorization:"Bearer "+svc},
      body:targetRaw,signal:AbortSignal.timeout(90000),
    });
    if(!res.ok) throw new Error("handler_failed_"+res.status);
    if(token && await rpc("stripe_webhook_mark_processed",{p_event_id:claimId,p_claim_token:token,p_handler:"router:"+handler})!==true) throw new Error("claim_lost");
    return reply({received:true});
  } catch(e) {
    if(token) await db.rpc("stripe_webhook_mark_failed",{p_event_id:claimId,p_claim_token:token,p_handler:"router:"+handler,p_error:String(e).slice(0,200),p_retry_after_seconds:60});
    return reply({error:"delivery_failed"},500);
  }
});

