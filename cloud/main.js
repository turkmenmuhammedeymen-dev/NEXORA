/**
 * NEXORA — Back4App Cloud Code
 * Deploy as cloud/main.js in the separate NEXORA Back4App app.
 */
const APP = 'NEXORA';
function requireUser(request) { if (!request.user) throw new Error('AUTH_REQUIRED'); return request.user; }
function textField(v, max, key) { if (typeof v !== 'string') throw new Error(key + '_INVALID'); const s=v.trim(); if (!s || s.length>max) throw new Error(key + '_INVALID'); return s; }
function slugify(v) { return v.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40); }
async function member(user, clanId, roles) {
  const q=new Parse.Query('NxClanMember'); q.equalTo('clanId', textField(clanId,64,'CLAN_ID')); q.equalTo('user',user); q.equalTo('status','active');
  const m=await q.first({useMasterKey:true}); if(!m || (roles && !roles.includes(m.get('role')))) throw new Error('CLAN_PERMISSION_DENIED'); return m;
}
async function clanById(id) { const q=new Parse.Query('NxClan'); q.equalTo('objectId',textField(id,64,'CLAN_ID')); const c=await q.first({useMasterKey:true}); if(!c) throw new Error('CLAN_NOT_FOUND'); return c; }
Parse.Cloud.define('nexoraHealth', async () => ({app:APP,status:'ok',version:'1.0.0',serverTime:new Date().toISOString()}));
Parse.Cloud.define('nexoraCreateClan', async request => {
  const user=requireUser(request), name=textField(request.params.name,50,'NAME');
  const description=typeof request.params.description==='string'?request.params.description.trim().slice(0,700):'';
  const base=slugify(request.params.slug || name); if(base.length<3) throw new Error('SLUG_INVALID');
  const check=new Parse.Query('NxClan'); check.equalTo('slug',base); if(await check.first({useMasterKey:true})) throw new Error('SLUG_TAKEN');
  const Clan=Parse.Object.extend('NxClan'), clan=new Clan();
  clan.set('name',name); clan.set('slug',base); clan.set('description',description); clan.set('owner',user);
  clan.set('visibility',request.params.visibility==='private'?'private':'public'); clan.set('memberCount',1);
  await clan.save(null,{useMasterKey:true});
  try {
    const Member=Parse.Object.extend('NxClanMember'), m=new Member(); m.set('clan',clan); m.set('clanId',clan.id); m.set('user',user); m.set('role','owner'); m.set('status','active');
    await m.save(null,{useMasterKey:true});
  } catch(e) { await clan.destroy({useMasterKey:true}); throw e; }
  return {id:clan.id,name:clan.get('name'),slug:clan.get('slug'),role:'owner'};
});
Parse.Cloud.define('nexoraListPublicClans', async request => {
  requireUser(request); const q=new Parse.Query('NxClan'); q.equalTo('visibility','public'); q.descending('createdAt'); q.limit(100);
  const rows=await q.find({useMasterKey:true}); return rows.map(c=>({id:c.id,name:c.get('name'),slug:c.get('slug'),description:c.get('description'),memberCount:c.get('memberCount')||0}));
});
Parse.Cloud.define('nexoraJoinClan', async request => {
  const user=requireUser(request), clan=await clanById(request.params.clanId);
  if(clan.get('visibility')==='private') throw new Error('INVITE_REQUIRED');
  const q=new Parse.Query('NxClanMember'); q.equalTo('clan',clan); q.equalTo('user',user);
  let m=await q.first({useMasterKey:true});
  if(m && m.get('status')==='banned') throw new Error('MEMBER_BANNED');
  if(m) return {status:m.get('status'),alreadyMember:true};
  const Member=Parse.Object.extend('NxClanMember'); m=new Member(); m.set('clan',clan); m.set('clanId',clan.id); m.set('user',user); m.set('role','member'); m.set('status','active');
  await m.save(null,{useMasterKey:true}); clan.increment('memberCount',1); await clan.save(null,{useMasterKey:true});
  return {status:'active',alreadyMember:false};
});
Parse.Cloud.define('nexoraListMyClans', async request => {
  const user=requireUser(request), q=new Parse.Query('NxClanMember'); q.equalTo('user',user); q.equalTo('status','active'); q.include('clan'); q.limit(100);
  const rows=await q.find({useMasterKey:true}); return rows.map(m=>{const c=m.get('clan');return c?{id:c.id,name:c.get('name'),slug:c.get('slug'),role:m.get('role'),memberCount:c.get('memberCount')||0}:null;}).filter(Boolean);
});
Parse.Cloud.define('nexoraSendMessage', async request => {
  const user=requireUser(request), clan=await clanById(request.params.clanId); await member(user,clan.id);
  const body=textField(request.params.body,2000,'MESSAGE');
  const Message=Parse.Object.extend('NxClanMessage'), msg=new Message(); msg.set('clan',clan); msg.set('clanId',clan.id); msg.set('sender',user); msg.set('body',body);
  await msg.save(null,{useMasterKey:true}); return {id:msg.id,body:msg.get('body'),createdAt:msg.createdAt};
});
Parse.Cloud.define('nexoraListMessages', async request => {
  const user=requireUser(request), clan=await clanById(request.params.clanId); await member(user,clan.id);
  const q=new Parse.Query('NxClanMessage'); q.equalTo('clan',clan); q.descending('createdAt'); q.limit(100); q.include('sender');
  const rows=await q.find({useMasterKey:true}); return rows.reverse().map(m=>({id:m.id,body:m.get('body'),createdAt:m.createdAt,sender:m.get('sender')?m.get('sender').get('username')||'Üye':'Üye'}));
});
Parse.Cloud.define('nexoraCreateReport', async request => {
  const user=requireUser(request), reason=textField(request.params.reason,1000,'REASON');
  if(reason.length<5) throw new Error('REASON_TOO_SHORT');
  const Report=Parse.Object.extend('NxModerationReport'), report=new Report(); report.set('reporter',user); report.set('reason',reason); report.set('status','open');
  if(request.params.clanId) report.set('clan',await clanById(request.params.clanId));
  if(request.params.targetUserId) { const target= new Parse.User(); target.id=textField(request.params.targetUserId,64,'TARGET_USER'); report.set('targetUser',target); }
  await report.save(null,{useMasterKey:true}); return {id:report.id,status:'open'};
});
Parse.Cloud.beforeSave('NxClan', request => { if(!request.master) throw new Error('USE_NEXORA_CLOUD_FUNCTIONS'); });
Parse.Cloud.beforeSave('NxClanMember', request => { if(!request.master) throw new Error('SERVER_WRITE_ONLY'); });
Parse.Cloud.beforeSave('NxClanMessage', request => { if(!request.master) throw new Error('USE_NEXORA_CLOUD_FUNCTIONS'); });
Parse.Cloud.beforeSave('NxModerationReport', request => { if(!request.master) throw new Error('USE_NEXORA_CLOUD_FUNCTIONS'); });
