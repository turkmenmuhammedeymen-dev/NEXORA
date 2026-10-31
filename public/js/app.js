(() => {
  const cfg=window.APP_BACK4APP, status=document.getElementById('backendStatus');
  if(!window.Parse || !cfg || cfg.applicationId.startsWith('PASTE_')) {if(status)status.textContent='Back4App bağlantısı için public App ID ve JavaScript Key ayarlanmalı.';return;}
  Parse.initialize(cfg.applicationId,cfg.javascriptKey); Parse.serverURL=cfg.serverURL;
  window.NEXORA={async signUp(username,email,password){const u=new Parse.User();u.set('username',username);u.set('email',email);u.set('password',password);return u.signUp();},
    async login(username,password){return Parse.User.logIn(username,password);},async logout(){return Parse.User.logOut();},
    async createClan(name,description){return Parse.Cloud.run('nexoraCreateClan',{name,description});},
    async joinClan(clanId){return Parse.Cloud.run('nexoraJoinClan',{clanId});},
    async listClans(){return Parse.Cloud.run('nexoraListPublicClans');},
    async listMyClans(){return Parse.Cloud.run('nexoraListMyClans');},
    async sendMessage(clanId,body){return Parse.Cloud.run('nexoraSendMessage',{clanId,body});},
    async listMessages(clanId){return Parse.Cloud.run('nexoraListMessages',{clanId});},
    async report(reason,clanId){return Parse.Cloud.run('nexoraCreateReport',{reason,clanId});}};
  Parse.Cloud.run('nexoraHealth').then(()=>{if(status)status.textContent='Back4App bağlı · oturum '+(Parse.User.current()?'açık':'kapalı');}).catch(e=>{if(status)status.textContent='Back4App bağlantı hatası: '+e.message;});
  const form=document.getElementById('clanForm');
  if(form)form.addEventListener('submit',async e=>{e.preventDefault();const out=document.getElementById('output');try{if(!Parse.User.current())throw Error('Önce giriş yapmalısın.');if(mode==='create'){const r=await NEXORA.createClan(document.getElementById('clan').value,document.getElementById('details').value);out.textContent='Klan Back4App üzerinde oluşturuldu: '+r.name+' ('+r.slug+')';}else{const clans=await NEXORA.listClans();out.textContent='Klan listesi yüklendi: '+clans.length+' herkese açık klan. Katılmak için klan kimliği gereklidir.';}out.style.display='block';}catch(err){out.style.display='block';out.textContent='İşlem tamamlanamadı: '+err.message;}});


  const authForm=document.getElementById('authForm');
  if(authForm)authForm.addEventListener('submit',async e=>{e.preventDefault();try{await NEXORA.login(document.getElementById('authUsername').value,document.getElementById('authPassword').value);if(status)status.textContent='Giriş başarılı. Back4App oturumu açıldı.';}catch(err){if(status)status.textContent='Giriş başarısız: '+err.message;}});
  const signUp=document.getElementById('signUpBtn');
  if(signUp)signUp.addEventListener('click',async()=>{try{await NEXORA.signUp(document.getElementById('authUsername').value,document.getElementById('authEmail').value,document.getElementById('authPassword').value);if(status)status.textContent='Hesap oluşturuldu. E-posta doğrulama ayarlarını Back4App panelinden etkinleştir.';}catch(err){if(status)status.textContent='Kayıt başarısız: '+err.message;}});
  const signOut=document.getElementById('signOutBtn');
  if(signOut)signOut.addEventListener('click',async()=>{try{await NEXORA.logout();if(status)status.textContent='Oturum kapatıldı.';}catch(err){if(status)status.textContent=err.message;}});

})();
