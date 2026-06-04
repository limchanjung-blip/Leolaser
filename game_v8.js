(function(){
  var $=function(i){return document.getElementById(i);};
  var cv=$('L_cv');if(!cv)return;var ctx=cv.getContext('2d'),W=cv.width,H=cv.height,GROUND=H-34;
  var scEl=$('L_sc'),wvEl=$('L_wv'),cbEl=$('L_cb'),cbx=$('L_cbx'),hpw=$('L_hpw');
  var menu=$('L_menu'),over=$('L_over'),fsc=$('L_fsc'),rankEl=$('L_rank'),fwv=$('L_fwv'),board=$('L_board'),board2=$('L_board2'),newhi=$('L_newhi'),howto=$('L_howto');
  var pad=$('L_pad'),fireBtn=$('L_fireBtn'),joy=$('L_joy'),stick=$('L_stick'),bgm=$('L_bgm');
  var sensEl=$('L_sens'),sensVEl=$('L_sensV'),sndBtn=$('L_snd');
  var sndOn=true, sensLevel=4;
  var isTouch=('ontouchstart' in window)||navigator.maxTouchPoints>0||(window.matchMedia&&window.matchMedia('(pointer: coarse)').matches);
  var headX=W/2,aimX=W/2,score=0,combo=0,mult=1,hp=4,maxHp=6,wave=1,running=false,dead=false;
  var foes=[],beams=[],parts=[],floats=[],stars=[],eshots=[],missiles=[],boss=null,moveDir=0;
  var raf=null,spawnT=null,spawnMs=1000,shakeT=0,flash=0,holding=false,fireCd=0,fireRate=24;
  var powerW=0,powerRapid=0,shield=0,powerHome=0,slowT=0,pierceT=0,droneT=0,firingGlow=0,wideAnim=0,pulse=0,banner='',bannerLife=0,vig=null,noFoeT=0;
  var killNeed=12,kills=0,bossActive=false;
  var NOZ_HW=11,NOZ_TOP=50;
  var GOOD=['#41d18f','#3ea6ff','#ffb020','#c97bff'];var WIDE_OFF=[-30,0,30];
  var PW={rapid:{c:'#ff8a4a',label:'연사',icon:'»'},wide:{c:'#41d18f',label:'와이드',icon:'▲'},shield:{c:'#3ea6ff',label:'실드',icon:'◇'},home:{c:'#ff5ad0',label:'유도탄',icon:'➤'},slow:{c:'#7ad0ff',label:'슬로우',icon:'🐌'},pierce:{c:'#ffe24a',label:'관통빔',icon:'⇅'},drone:{c:'#9affd0',label:'드론',icon:'◈'},heal:{c:'#ff6a8a',label:'수리',icon:'+'},bomb:{c:'#ffae3a',label:'폭탄',icon:'✸'}};
  var POOL=['rapid','wide','shield','home','slow','pierce','drone','heal','bomb'];
  var BOSSES=[{name:'모선',col:'#ff3b3b'},{name:'구축함',col:'#ff8a1e'},{name:'원반 모함',col:'#c97bff'},{name:'건십',col:'#3ea6ff'}];
  var ETYPES=['scout','fighter','bomber','interceptor','saucer'];
  var MOVES_BASE=['straight','sine','sweep'],MOVES_HARD=['straight','zigzag','sine','sweep','dive','circle','pause','homing'];
  var actx=null,master=null;
  function ac(){try{if(!actx){actx=new(window.AudioContext||window.webkitAudioContext)();master=actx.createGain();master.gain.value=sndOn?0.85:0;master.connect(actx.destination);}if(actx.state==='suspended')actx.resume();}catch(e){}return actx;}
  function applySound(){if(master){try{master.gain.value=sndOn?0.85:0;}catch(_){}}if(bgm){try{bgm.muted=!sndOn;}catch(_){}}}
  function bgmPlay(){if(!sndOn)return;if(bgm){try{bgm.currentTime=0;bgm.volume=0.55;bgm.muted=false;bgm.loop=true;var p=bgm.play();if(p&&p.catch)p.catch(function(){});}catch(e){}}}
  function bgmStop(){if(bgm){try{bgm.pause();}catch(e){}}}
  function laserSnd(){var c=ac();if(!c)return;var t=c.currentTime;var o=c.createOscillator();o.type='sawtooth';o.frequency.setValueAtTime(2400,t);o.frequency.exponentialRampToValueAtTime(120,t+0.5);var g=c.createGain();g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(0.12,t+0.01);g.gain.exponentialRampToValueAtTime(0.001,t+0.5);o.connect(g);g.connect(master);o.start(t);o.stop(t+0.53);}
  function snd(type){var c=ac();if(!c)return;var t=c.currentTime;
    if(type==='cut'){var n=(c.sampleRate*0.08)|0,b=c.createBuffer(1,n,c.sampleRate),d=b.getChannelData(0);for(var i=0;i<n;i++)d[i]=(Math.random()<0.6)?(Math.random()*2-1)*Math.pow(1-i/n,1.4):0;var s=c.createBufferSource();s.buffer=b;var g=c.createGain();g.gain.value=0.12;var f=c.createBiquadFilter();f.type='bandpass';f.frequency.value=3000;s.connect(f);f.connect(g);g.connect(master);s.start(t);}
    else if(type==='hit'){var o=c.createOscillator();o.type='sawtooth';o.frequency.setValueAtTime(200,t);o.frequency.exponentialRampToValueAtTime(40,t+0.35);var g2=c.createGain();g2.gain.setValueAtTime(0.3,t);g2.gain.exponentialRampToValueAtTime(0.001,t+0.35);o.connect(g2);g2.connect(master);o.start(t);o.stop(t+0.35);}
    else if(type==='gold'){[0,0.07,0.14].forEach(function(dt,k){var o=c.createOscillator();o.type='triangle';o.frequency.value=720+k*240;var g=c.createGain();g.gain.setValueAtTime(0.0001,t+dt);g.gain.linearRampToValueAtTime(0.13,t+dt+0.01);g.gain.exponentialRampToValueAtTime(0.001,t+dt+0.12);o.connect(g);g.connect(master);o.start(t+dt);o.stop(t+dt+0.13);});}
    else if(type==='power'){[0,0.1].forEach(function(dt){var o=c.createOscillator();o.type='sine';o.frequency.setValueAtTime(520,t+dt);o.frequency.exponentialRampToValueAtTime(1500,t+dt+0.18);var g=c.createGain();g.gain.setValueAtTime(0.13,t+dt);g.gain.exponentialRampToValueAtTime(0.001,t+dt+0.22);o.connect(g);g.connect(master);o.start(t+dt);o.stop(t+dt+0.24);});}
    else if(type==='miss'){var o=c.createOscillator();o.type='sawtooth';o.frequency.setValueAtTime(700,t);o.frequency.exponentialRampToValueAtTime(1600,t+0.25);var g=c.createGain();g.gain.setValueAtTime(0.08,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.26);o.connect(g);g.connect(master);o.start(t);o.stop(t+0.27);}
    else if(type==='bomb'){var n=(c.sampleRate*0.8)|0,b=c.createBuffer(1,n,c.sampleRate),d=b.getChannelData(0);for(var i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,1.1);var s=c.createBufferSource();s.buffer=b;var g=c.createGain();g.gain.value=0.42;var f=c.createBiquadFilter();f.type='lowpass';f.frequency.setValueAtTime(1200,t);f.frequency.exponentialRampToValueAtTime(200,t+0.8);s.connect(f);f.connect(g);g.connect(master);s.start(t);}
    else if(type==='boss'){var o=c.createOscillator();o.type='sawtooth';o.frequency.setValueAtTime(80,t);o.frequency.linearRampToValueAtTime(200,t+0.6);var g=c.createGain();g.gain.setValueAtTime(0.22,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.7);o.connect(g);g.connect(master);o.start(t);o.stop(t+0.72);}
    else if(type==='boom'){var n=(c.sampleRate*0.6)|0,b=c.createBuffer(1,n,c.sampleRate),d=b.getChannelData(0);for(var i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,1.3);var s=c.createBufferSource();s.buffer=b;var g=c.createGain();g.gain.value=0.4;var f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=700;s.connect(f);f.connect(g);g.connect(master);s.start(t);}
    else if(type==='wave'){[0,0.12,0.24].forEach(function(dt,k){var o=c.createOscillator();o.type='triangle';o.frequency.value=440+k*180;var g=c.createGain();g.gain.setValueAtTime(0.0001,t+dt);g.gain.linearRampToValueAtTime(0.11,t+dt+0.02);g.gain.exponentialRampToValueAtTime(0.001,t+dt+0.2);o.connect(g);g.connect(master);o.start(t+dt);o.stop(t+dt+0.22);});}
    else if(type==='eshot'){var o=c.createOscillator();o.type='square';o.frequency.setValueAtTime(420,t);o.frequency.exponentialRampToValueAtTime(180,t+0.08);var g=c.createGain();g.gain.setValueAtTime(0.035,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.09);o.connect(g);g.connect(master);o.start(t);o.stop(t+0.1);}
  }
  function vibe(p){if(navigator.vibrate){try{navigator.vibrate(p);}catch(_){}}}
  function R(a,b){return a+Math.random()*(b-a);}
  function ri(a,b){return a+Math.floor(Math.random()*(b-a+1));}
  function getScores(){try{return JSON.parse(localStorage.getItem('leo_laser_top')||'[]');}catch(_){return[];}}
  function saveScore(s){var a=getScores();a.push(s);a.sort(function(x,y){return y-x;});a=a.slice(0,10);try{localStorage.setItem('leo_laser_top',JSON.stringify(a));}catch(_){}return a;}
  function renderBoard(el,hl){var a=getScores();var head='<div style="display:flex;align-items:center;gap:6px;justify-content:center;font-size:11px;letter-spacing:.18em;color:#ffd24a;margin-bottom:8px;text-shadow:0 0 10px rgba(255,210,80,.5);">🏆 LEADERBOARD 🏆</div>';
    if(!a.length){el.innerHTML='<div style="background:linear-gradient(180deg,rgba(255,255,255,.04),rgba(255,255,255,.01));border:1px solid rgba(255,56,21,.2);border-radius:12px;padding:14px;">'+head+'<div style="color:#666;font-size:11px;text-align:center;">아직 기록이 없어요</div></div>';return;}
    var medals=['linear-gradient(135deg,#ffe27a,#e0a000)','linear-gradient(135deg,#e8e8f0,#9a9ab0)','linear-gradient(135deg,#e8954a,#a8521e)'];var rows='';
    for(var i=0;i<a.length;i++){var h=(hl!=null&&a[i]===hl&&a.indexOf(hl)===i);var badge=i<3?'<span style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:'+medals[i]+';color:#3a2400;font-size:11px;font-weight:700;">'+(i+1)+'</span>':'<span style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;color:#888;font-size:11px;">'+(i+1)+'</span>';rows+='<div style="display:flex;align-items:center;justify-content:space-between;padding:5px 10px;border-radius:8px;margin-bottom:3px;'+(h?'background:linear-gradient(90deg,rgba(255,210,80,.18),rgba(255,210,80,.02));box-shadow:0 0 0 1px rgba(255,210,80,.4);':'background:rgba(255,255,255,.025);')+'"><span style="display:flex;align-items:center;gap:9px;">'+badge+(h?'<span style="color:#ffd24a;font-size:10px;">YOU</span>':'')+'</span><b style="color:'+(h?'#ffd24a':'#fff')+';font-size:13px;">'+a[i].toLocaleString()+'</b></div>';}
    el.innerHTML='<div style="background:linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.01));border:1px solid rgba(255,56,21,.25);border-radius:12px;padding:12px 10px;">'+head+rows+'</div>';}
  function nozzleIcon(on){return '<svg width="12" height="16" viewBox="0 0 13 17" style="display:block;"><rect x="3" y="1" width="7" height="6" rx="1" fill="'+(on?'#5a5a64':'#333')+'"/><polygon points="3,7 10,7 8,16 5,16" fill="'+(on?'#7a7a86':'#2a2a2e')+'"/><circle cx="6.5" cy="15" r="2" fill="'+(on?'#ff3815':'#444')+'"/></svg>';}
  function setHp(){var h='';for(var i=0;i<maxHp;i++)h+=nozzleIcon(i<hp);hpw.innerHTML=h;}
  function pickMove(type){if(type==='bomber')return Math.random()<0.6?'straight':'pause';if(type==='interceptor')return Math.random()<0.5?'zigzag':'sine';if(type==='scout')return Math.random()<0.5?'sine':'drift';if(type==='saucer')return Math.random()<0.5?'circle':'sweep';var pool=wave>=3?MOVES_HARD:MOVES_BASE;return pool[ri(0,pool.length-1)];}
  function spawn(){if(bossActive||dead||!running)return;noFoeT=0;
    var roll=Math.random(),type,pk=null;
    if(roll<0.06){type='gold';}else if(roll<0.16){type='power';pk=POOL[ri(0,POOL.length-1)];}
    else{type=ETYPES[ri(0,ETYPES.length-1)];}
    var sz=type==='bomber'?ri(48,58):type==='saucer'?ri(44,52):(type==='gold'||type==='power')?ri(28,36):ri(34,46);
    var x=R(sz+8,W-sz-8);var spd=(R(0.4,0.66)+wave*(isTouch?0.055:0.075))*(isTouch?0.72:0.9);if(type==='saucer')spd*=0.8;
    var shooter=(type!=='gold'&&type!=='power');
    var cd=type==='scout'?ri(150,230):ri(80,170);var mv=(type==='gold'||type==='power')?'sine':pickMove(type);
    foes.push({x:x,y:-sz,sz:sz,vy:spd,vx:R(-0.35,0.35),amp:R(40,85),freq:R(200,440),mv:mv,sweepDir:Math.random()<0.5?-1:1,type:type,pk:pk,col:type==='gold'?'#ffd24a':type==='power'?PW[pk].c:type==='saucer'?'#b06aff':GOOD[ri(0,3)],hp:(type==='bomber'||type==='saucer')?2:1,t0:Date.now(),x0:x,phase:R(0,6.28),dead:false,shooter:shooter,shootCd:cd,val:type==='bomber'?20:type==='saucer'?25:type==='scout'?10:15});
  }
  function spawnBoss(){bossActive=true;var bt=(wave-1)%BOSSES.length;var bhp=18+wave*8;boss={x:W/2,y:-90,baseY:96,bt:bt,sz:86,vx:(0.9+wave*0.15)*(bt===1?1.8:1),hp:bhp,maxhp:bhp,col:BOSSES[bt].col,shootCd:50,pat:0,mt:0,diveT:0,dead:false,entering:true,_k:false};banner='⚠ '+BOSSES[bt].name+' ⚠';bannerLife=1.5;snd('boss');vibe([40,30,60]);}
  function launchMissile(x){missiles.push({x:x,y:GROUND-52,vx:R(-1.5,1.5),vy:-3.5,spd:5.4,life:210});snd('miss');}
  function fire(){if(!running||dead||fireCd>0)return;fireCd=powerRapid>0?6:fireRate;flash=Math.max(flash,0.4);firingGlow=1;vibe(6);
    var lanes=powerW>0?WIDE_OFF.map(function(o){return headX+o;}):[headX];
    if(droneT>0){lanes=lanes.concat([headX-48,headX+48]);}
    if(powerHome>0){lanes.forEach(function(nx){launchMissile(nx);});return;}
    laserSnd();
    lanes.forEach(function(nozX){var lx=nozX;beams.push({x:nozX,ty:lx,life:1,w:powerW>0?2.4:3.6});
      var cands=[];if(boss&&!boss.dead&&boss.y>0&&Math.abs(boss.x-lx)<boss.sz/2+6)cands.push({boss:true,y:boss.y});
      for(var i=0;i<foes.length;i++){var f=foes[i];if(f.dead)continue;if(Math.abs(f.x-lx)<f.sz/2+8)cands.push(f);}
      cands.sort(function(a,b){return b.y-a.y;});
      if(pierceT>0){for(var c=0;c<cands.length;c++){if(cands[c].boss)hitBoss(lx);else damage(cands[c],lx);}}
      else if(cands.length){if(cands[0].boss)hitBoss(lx);else damage(cands[0],lx);}
      for(var m=0;m<5;m++)parts.push({x:nozX,y:GROUND-46,vx:R(-1.6,1.6),vy:R(-3,-0.8),life:1,col:Math.random()<0.5?'#fff':'#ffd24a',sz:R(2,4)});
    });
  }
  function hitBoss(lx){if(!boss||boss.dead)return;boss.hp--;explode(lx,boss.y+boss.sz/3,'#ff8a4a',false);snd('cut');combo++;mult=1+((combo/4)|0);score+=5*mult;scEl.textContent=score;cbx.textContent=mult;cbEl.style.opacity=combo>=2?'1':'0';if(boss.hp<=0)killBoss();}
  function killBoss(){if(!boss||boss._k)return;boss._k=true;boss.dead=true;bossActive=false;snd('boom');vibe([60,40,80]);shakeT=20;flash=0.9;score+=200+wave*50;scEl.textContent=score;floats.push({x:boss.x,y:boss.y+20,txt:'BOSS +'+(200+wave*50),c:'#ffd24a',life:1.6});for(var i=0;i<46;i++){var a=R(0,6.28),sp=R(2,9);parts.push({x:boss.x,y:boss.y+boss.sz/3,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:1,col:Math.random()<0.5?'#ffd24a':'#ff5a3c',sz:R(3,7)});}setTimeout(function(){boss=null;nextWave();},800);}
  function nextWave(){wave++;wvEl.textContent=wave;kills=0;killNeed=12+wave*2;spawnMs=Math.max(isTouch?640:500,(isTouch?1280:1140)-wave*(isTouch?32:38));bossActive=false;restartSpawn();banner='WAVE '+wave;bannerLife=1.2;snd('wave');}
  function showPU(pk){banner=PW[pk].icon+' '+PW[pk].label;bannerLife=1.0;}
  function gainItem(f){
    if(f.type==='gold'){snd('gold');vibe([12,18,12]);score+=80;flash=Math.max(flash,0.4);floats.push({x:f.x,y:f.y,txt:'+80',c:'#ffd24a',life:1});for(var i=0;i<20;i++){var a=R(0,6.28),sp=R(2,6);parts.push({x:f.x,y:f.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:1,col:'#ffd24a',sz:R(3,5)});}scEl.textContent=score;return;}
    snd('power');vibe([15,15,25]);var pk=f.pk;
    if(pk==='rapid')powerRapid=480;else if(pk==='wide')powerW=480;else if(pk==='home')powerHome=420;else if(pk==='slow')slowT=420;else if(pk==='pierce')pierceT=480;else if(pk==='drone')droneT=540;else if(pk==='shield')shield=Math.min(shield+1,2);
    else if(pk==='heal'){hp=Math.min(hp+1,maxHp);setHp();}else if(pk==='bomb'){doBomb();}
    showPU(pk);for(var j=0;j<14;j++){var a2=R(0,6.28),sp2=R(2,5);parts.push({x:f.x,y:f.y,vx:Math.cos(a2)*sp2,vy:Math.sin(a2)*sp2,life:1,col:f.col,sz:4});}
  }
  function doBomb(){snd('bomb');vibe([80,40,80]);shakeT=18;flash=1;for(var i=foes.length-1;i>=0;i--){var f=foes[i];if(f.dead||f.type==='gold'||f.type==='power')continue;explode(f.x,f.y,f.col,true);score+=f.val;f.dead=true;kills++;}eshots=[];scEl.textContent=score;floats.push({x:W/2,y:H/2,txt:'폭탄!',c:'#ffae3a',life:1.2});if(kills>=killNeed&&!bossActive)spawnBoss();}
  function damage(f,lx){if(f.dead)return;
    if(f.type==='gold'||f.type==='power'){f.dead=true;gainItem(f);return;}
    f.hp--;explode(f.x,f.y,f.col,false);
    if(f.hp>0){snd('cut');floats.push({x:f.x,y:f.y,txt:'+5',c:'#fff',life:0.7});score+=5;scEl.textContent=score;return;}
    f.dead=true;snd('cut');combo++;mult=1+((combo/4)|0);var gain=f.val*mult;score+=gain;floats.push({x:f.x,y:f.y,txt:'+'+gain,c:mult>1?'#ffb020':'#fff',life:1});cbx.textContent=mult;cbEl.style.opacity=combo>=2?'1':'0';explode(f.x,f.y,f.col,true);kills++;if(kills>=killNeed&&!bossActive)spawnBoss();scEl.textContent=score;
  }
  function playerHit(){if(shield>0){shield--;setHp();explode(headX,GROUND-30,'#3ea6ff',false);snd('cut');return;}
    hp--;setHp();snd('hit');vibe([60,40,80]);shakeT=16;flash=0.7;
    for(var i=0;i<26;i++){var a=R(0,6.28),sp=R(2,7);parts.push({x:headX,y:GROUND-26,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-1.5,life:1,col:Math.random()<0.5?'#ffd24a':'#ff5a3c',sz:R(3,6)});}
    if(hp<=0)blowUpPlayer();}
  function blowUpPlayer(){dead=true;snd('boom');vibe([100,50,120]);shakeT=24;flash=1;for(var i=0;i<50;i++){var a=R(0,6.28),sp=R(2,10);parts.push({x:headX,y:GROUND-26,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-2,life:1,col:Math.random()<0.5?'#ffd24a':'#ff5a3c',sz:R(3,8)});}setTimeout(endGame,900);}
  function explode(x,y,col,big){var n=big?18:9;for(var i=0;i<n;i++){var a=R(0,6.28),sp=R(1.5,big?5:3.5);parts.push({x:x,y:y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-1,life:1,col:Math.random()<0.5?'#ffd24a':col,sz:big?4:3});}}
  function restartSpawn(){clearInterval(spawnT);spawnT=setInterval(function(){if(running&&!bossActive&&!dead)spawn();},spawnMs);}
  function rr(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
  function eShot(x,y,vx,vy,kind){eshots.push({x:x,y:y,vx:vx||0,vy:vy,kind:kind||'bullet'});snd('eshot');}
  function aimShot(f){var sp=2.5+wave*0.1;var dx=headX-f.x,dy=(GROUND-26)-(f.y+f.sz/2),d=Math.hypot(dx,dy)||1;eShot(f.x,f.y+f.sz/2,dx/d*sp,dy/d*sp,'bullet');}
  function lg(x0,y0,x1,y1,cs){var g=ctx.createLinearGradient(x0,y0,x1,y1);for(var i=0;i<cs.length;i++)g.addColorStop(cs[i][0],cs[i][1]);return g;}
  function canopy(x,y,rx,ry,col){var bl=0.65+0.35*Math.sin(Date.now()/220);ctx.shadowColor=col;ctx.shadowBlur=12*bl;ctx.fillStyle=col;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,6.28);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='rgba(255,255,255,.85)';ctx.beginPath();ctx.ellipse(x-rx*0.28,y-ry*0.3,rx*0.34,ry*0.3,0,0,6.28);ctx.fill();}
  function drawFoe(f){ctx.save();ctx.translate(f.x,f.y);var h=f.sz/2;var now=Date.now();
    if(f.type==='scout'){
      ctx.fillStyle=f.col;ctx.globalAlpha=.28;ctx.shadowColor=f.col;ctx.shadowBlur=16;ctx.beginPath();ctx.ellipse(0,h*0.28,h*0.98,h*0.22,0,0,6.28);ctx.fill();ctx.globalAlpha=1;
      ctx.shadowBlur=7;ctx.fillStyle=lg(0,-h*0.4,0,h*0.4,[[0,'#f2f2f8'],[0.5,f.col],[1,'#22222e']]);ctx.beginPath();ctx.ellipse(0,0,h,h*0.4,0,0,6.28);ctx.fill();ctx.shadowBlur=0;
      canopy(0,-h*0.06,h*0.4,h*0.3,'#5ad0ff');
      var bl=0.4+0.6*Math.abs(Math.sin(now/260+f.phase));ctx.fillStyle='rgba(120,255,210,'+bl+')';ctx.shadowColor='#7affd0';ctx.shadowBlur=5;for(var i=-2;i<=2;i+=2){ctx.beginPath();ctx.arc(i*h*0.42,h*0.18,2,0,6.28);ctx.fill();}ctx.shadowBlur=0;
    } else if(f.type==='fighter'){
      ctx.shadowColor='#ff5a4a';ctx.shadowBlur=10;ctx.fillStyle='#5a1010';ctx.beginPath();ctx.moveTo(0,-h*0.15);ctx.lineTo(h*0.9,h*0.12);ctx.lineTo(h*0.32,h*0.34);ctx.lineTo(-h*0.32,h*0.34);ctx.lineTo(-h*0.9,h*0.12);ctx.closePath();ctx.fill();
      ctx.fillStyle=lg(0,-h*0.8,0,h*0.8,[[0,'#ff9a8a'],[0.5,'#ff4530'],[1,'#5a0c0c']]);ctx.beginPath();ctx.ellipse(0,0,h*0.46,h*0.82,0,0,6.28);ctx.fill();ctx.shadowBlur=0;
      canopy(0,-h*0.26,h*0.22,h*0.3,'#5ad0ff');
      var eg=0.5+0.5*Math.sin(now/70);ctx.fillStyle='rgba(255,170,70,'+eg+')';ctx.shadowColor='#ff8a30';ctx.shadowBlur=9;ctx.beginPath();ctx.arc(0,h*0.78,2.6,0,6.28);ctx.fill();ctx.shadowBlur=0;
    } else if(f.type==='bomber'){
      ctx.shadowColor='#e0954c';ctx.shadowBlur=9;ctx.fillStyle=lg(-h,0,h,0,[[0,'#3a2210'],[0.5,'#7a4a1e'],[1,'#3a2210']]);ctx.beginPath();ctx.moveTo(-h,h*0.02);ctx.lineTo(h,h*0.02);ctx.lineTo(h*0.5,h*0.32);ctx.lineTo(-h*0.5,h*0.32);ctx.closePath();ctx.fill();
      ctx.fillStyle=lg(0,-h*0.75,0,h*0.75,[[0,'#ffd49a'],[0.5,'#e0954c'],[1,'#6a3a18']]);ctx.beginPath();ctx.ellipse(0,-h*0.05,h*0.47,h*0.74,0,0,6.28);ctx.fill();
      ctx.strokeStyle='rgba(110,60,20,.4)';ctx.lineWidth=1;for(var L=-2;L<=2;L++){ctx.beginPath();ctx.moveTo(-h*0.4,L*h*0.18);ctx.lineTo(h*0.4,L*h*0.18);ctx.stroke();}ctx.shadowBlur=0;
      canopy(0,-h*0.22,h*0.26,h*0.22,'#5ad0ff');
      ctx.fillStyle='#2a1c10';rr(-h*0.78,h*0.04,h*0.26,h*0.2,2);ctx.fill();rr(h*0.52,h*0.04,h*0.26,h*0.2,2);ctx.fill();
      var bg=0.5+0.5*Math.sin(now/90);ctx.fillStyle='rgba(255,140,60,'+bg+')';ctx.shadowColor='#ff8a30';ctx.shadowBlur=7;ctx.beginPath();ctx.arc(-h*0.65,h*0.24,2,0,6.28);ctx.arc(h*0.65,h*0.24,2,0,6.28);ctx.fill();ctx.shadowBlur=0;
    } else if(f.type==='saucer'){
      ctx.save();ctx.rotate(now/1100);ctx.shadowColor='#b06aff';ctx.shadowBlur=16;ctx.fillStyle='#b06aff';ctx.globalAlpha=.3;ctx.beginPath();ctx.ellipse(0,0,h*1.05,h*0.3,0,0,6.28);ctx.fill();ctx.globalAlpha=1;
      ctx.shadowBlur=6;ctx.fillStyle=lg(0,-h*0.3,0,h*0.3,[[0,'#d8a8ff'],[0.5,'#8a4fd0'],[1,'#3a1a55']]);ctx.beginPath();ctx.ellipse(0,0,h,h*0.32,0,0,6.28);ctx.fill();ctx.shadowBlur=0;
      var sg=0.4+0.6*Math.abs(Math.sin(now/140));ctx.fillStyle='rgba(201,123,255,'+sg+')';for(var s=-2;s<=2;s++){ctx.beginPath();ctx.arc(s*h*0.36,h*0.1,2,0,6.28);ctx.fill();}ctx.restore();
      canopy(0,-h*0.04,h*0.38,h*0.26,'#5ad0ff');
    } else {
      ctx.shadowColor='#c97bff';ctx.shadowBlur=10;ctx.fillStyle='#3a1a55';ctx.beginPath();ctx.moveTo(0,-h*0.2);ctx.lineTo(h*0.82,h*0.18);ctx.lineTo(0,h*0.05);ctx.lineTo(-h*0.82,h*0.18);ctx.closePath();ctx.fill();
      ctx.fillStyle=lg(0,-h*0.85,0,h*0.85,[[0,'#e8b8ff'],[0.5,'#9b59d0'],[1,'#3a1a55']]);ctx.beginPath();ctx.ellipse(0,0,h*0.34,h*0.86,0,0,6.28);ctx.fill();ctx.shadowBlur=0;
      canopy(0,-h*0.3,h*0.18,h*0.3,'#5ad0ff');
      var ig=0.5+0.5*Math.sin(now/100);ctx.fillStyle='rgba(220,170,255,'+ig+')';ctx.shadowColor='#c97bff';ctx.shadowBlur=8;ctx.beginPath();ctx.arc(0,h*0.8,2.6,0,6.28);ctx.fill();ctx.shadowBlur=0;
    }
    ctx.restore();}
  function drawPowerItem(f){ctx.save();ctx.translate(f.x,f.y);var h=f.sz/2;var c=f.col;ctx.shadowColor=c;ctx.shadowBlur=14;ctx.strokeStyle=c;ctx.lineWidth=2;ctx.rotate(Date.now()/600);ctx.beginPath();for(var k=0;k<6;k++){var an=k*1.047;var px=Math.cos(an)*h,py=Math.sin(an)*h;k?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.closePath();ctx.stroke();ctx.rotate(-Date.now()/600);ctx.shadowBlur=0;if(f.pk==='slow'){drawSnail(0,0,f.sz*0.7,c);}else{ctx.fillStyle=c;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold '+(f.sz*0.5)+'px monospace';ctx.fillText(PW[f.pk].icon,0,1);}ctx.restore();}
  function drawSnail(x,y,s,col){ctx.save();ctx.translate(x,y);ctx.shadowColor=col;ctx.shadowBlur=8;ctx.strokeStyle=col;ctx.lineWidth=s*0.12;ctx.beginPath();var pr=s*0.5;for(var a=0;a<6.5;a+=0.25){var rr2=pr*(1-a/9);var px=Math.cos(a)*rr2-s*0.1,py=Math.sin(a)*rr2-s*0.1;a?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.stroke();ctx.fillStyle=col;ctx.beginPath();ctx.ellipse(s*0.35,s*0.28,s*0.32,s*0.16,0,0,6.28);ctx.fill();ctx.lineWidth=s*0.07;ctx.beginPath();ctx.moveTo(s*0.6,s*0.18);ctx.lineTo(s*0.72,-s*0.05);ctx.moveTo(s*0.5,s*0.16);ctx.lineTo(s*0.58,-s*0.08);ctx.stroke();ctx.shadowBlur=0;ctx.restore();}
  function drawGold(f){ctx.save();ctx.translate(f.x,f.y);var h=f.sz/2;ctx.rotate(Date.now()/500);ctx.shadowColor='#ffd24a';ctx.shadowBlur=14;ctx.fillStyle='#ffd24a';ctx.beginPath();for(var k=0;k<10;k++){var an=Math.PI/5*k-Math.PI/2,rad=k%2?h*0.45:h;var px=Math.cos(an)*rad,py=Math.sin(an)*rad;k?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.closePath();ctx.fill();ctx.restore();}
  function drawMissile(m){ctx.save();ctx.translate(m.x,m.y);var ang=Math.atan2(m.vy,m.vx)+Math.PI/2;ctx.rotate(ang);ctx.shadowColor='#ff5ad0';ctx.shadowBlur=10;ctx.fillStyle='#ff5ad0';ctx.beginPath();ctx.moveTo(0,-8);ctx.lineTo(3,5);ctx.lineTo(-3,5);ctx.closePath();ctx.fill();ctx.fillStyle='#fff';ctx.fillRect(-1.5,-4,3,4);ctx.shadowBlur=0;ctx.restore();}
  function drawBoss(){var b=boss;ctx.save();ctx.translate(b.x,b.y);var h=b.sz/2;ctx.shadowColor=b.col;ctx.shadowBlur=22;
    if(b.bt===0){ctx.fillStyle=b.col;ctx.globalAlpha=.25;ctx.beginPath();ctx.ellipse(0,h*0.3,h*1.05,h*0.3,0,0,6.28);ctx.fill();ctx.globalAlpha=1;ctx.shadowBlur=10;ctx.fillStyle=lg(0,-h*0.5,0,h*0.5,[[0,'#ff8a7a'],[0.5,'#c02020'],[1,'#3a0808']]);ctx.beginPath();ctx.ellipse(0,0,h,h*0.5,0,0,6.28);ctx.fill();ctx.shadowBlur=0;canopy(0,-h*0.08,h*0.4,h*0.3,'#ffd24a');var bl=0.5+0.5*Math.sin(Date.now()/120);ctx.fillStyle='rgba(255,210,80,'+(0.4+bl*0.5)+')';for(var i=-2;i<=2;i++){ctx.beginPath();ctx.arc(i*h*0.36,h*0.36,3.5,0,6.28);ctx.fill();}}
    else if(b.bt===1){ctx.shadowBlur=10;ctx.fillStyle=lg(0,-h*0.4,0,h*0.4,[[0,'#ffc27a'],[0.5,'#d8742a'],[1,'#4a2810']]);rr(-h,-h*0.3,b.sz,h*0.6,6);ctx.fill();ctx.fillStyle=lg(0,-h*0.5,0,0,[[0,'#ffd49a'],[1,'#a85a1e']]);rr(-h*0.92,-h*0.48,h*1.84,h*0.48,4);ctx.fill();ctx.shadowBlur=0;canopy(0,-h*0.18,h*0.3,h*0.18,'#5ad0ff');ctx.fillStyle='#3a2410';for(var g=-3;g<=3;g++){ctx.fillRect(g*h*0.26-2,h*0.16,4,8);}}
    else if(b.bt===2){ctx.save();ctx.rotate(Date.now()/900);ctx.fillStyle='#3a1a55';ctx.beginPath();ctx.arc(0,0,h,0,6.28);ctx.fill();ctx.fillStyle=lg(0,-h*0.7,0,h*0.7,[[0,'#d8a8ff'],[0.5,'#8a4fd0'],[1,'#2a1040']]);ctx.beginPath();ctx.arc(0,0,h*0.82,0,6.28);ctx.fill();ctx.fillStyle='rgba(201,123,255,.9)';for(var s=0;s<10;s++){var a=s*0.628;ctx.beginPath();ctx.arc(Math.cos(a)*h*0.9,Math.sin(a)*h*0.9,2.4,0,6.28);ctx.fill();}ctx.restore();ctx.shadowBlur=0;canopy(0,0,h*0.34,h*0.34,'#ff5ad0');}
    else{ctx.shadowBlur=10;ctx.fillStyle=lg(0,-h*0.4,0,h*0.4,[[0,'#8ad0ff'],[0.5,'#1c6a9c'],[1,'#0a2a40']]);rr(-h*0.92,-h*0.4,h*1.84,h*0.8,8);ctx.fill();ctx.fillStyle=lg(0,-h*0.55,0,0,[[0,'#bfe6ff'],[1,'#1c6a9c']]);rr(-h*0.5,-h*0.55,h,h*0.5,5);ctx.fill();ctx.shadowBlur=0;canopy(0,-h*0.28,h*0.3,h*0.18,'#ffd24a');ctx.fillStyle='#0a2a40';ctx.beginPath();ctx.arc(-h*0.6,h*0.22,5,0,6.28);ctx.arc(h*0.6,h*0.22,5,0,6.28);ctx.fill();ctx.fillStyle='rgba(120,210,255,.9)';ctx.beginPath();ctx.arc(-h*0.6,h*0.22,2.5,0,6.28);ctx.arc(h*0.6,h*0.22,2.5,0,6.28);ctx.fill();}
    ctx.restore();var bw=b.sz*1.5,bx=b.x-bw/2,by=b.y-h-16;ctx.fillStyle='rgba(0,0,0,.5)';ctx.fillRect(bx,by,bw,6);ctx.fillStyle=b.col;ctx.fillRect(bx,by,bw*Math.max(0,b.hp/b.maxhp),6);ctx.strokeStyle='rgba(255,255,255,.3)';ctx.lineWidth=1;ctx.strokeRect(bx,by,bw,6);}
  function nozzleBody(bx,by,hot){ctx.strokeStyle='#3a3a44';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(bx+9,by-30);ctx.quadraticCurveTo(bx+20,by-36,bx+17,by-20);ctx.stroke();ctx.fillStyle='#1e1e26';rr(bx-12,by-42,24,24,3);ctx.fill();ctx.fillStyle='#34343f';rr(bx-12,by-42,8,24,3);ctx.fill();ctx.fillStyle='#52525e';rr(bx-10,by-42,3,24,2);ctx.fill();ctx.fillStyle='#0e0e14';for(var i=0;i<4;i++){ctx.fillRect(bx-12,by-39+i*5,24,1.5);}ctx.fillStyle=hot?'#ff6a2a':'#41d18f';ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=6;ctx.beginPath();ctx.arc(bx+7,by-38,1.6,0,6.28);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#4a4a56';ctx.beginPath();ctx.moveTo(bx-12,by-18);ctx.lineTo(bx+12,by-18);ctx.lineTo(bx+5.5,by-52);ctx.lineTo(bx-5.5,by-52);ctx.closePath();ctx.fill();ctx.fillStyle='#66666f';ctx.beginPath();ctx.moveTo(bx-12,by-18);ctx.lineTo(bx-4,by-18);ctx.lineTo(bx-2,by-52);ctx.lineTo(bx-5.5,by-52);ctx.closePath();ctx.fill();ctx.fillStyle='#2a2a32';ctx.beginPath();ctx.moveTo(bx+12,by-18);ctx.lineTo(bx+5,by-18);ctx.lineTo(bx+3,by-52);ctx.lineTo(bx+5.5,by-52);ctx.closePath();ctx.fill();var glow=14+firingGlow*20+(hot?pulse*8:0);ctx.shadowColor='#ff3815';ctx.shadowBlur=glow;ctx.strokeStyle='rgba(255,90,60,'+(0.5+firingGlow*0.5)+')';ctx.lineWidth=2;ctx.beginPath();ctx.arc(bx,by-53,5,0,6.28);ctx.stroke();ctx.fillStyle=firingGlow>0.1?'#fff':(hot?'#ff7a3a':'#ff5a3c');ctx.beginPath();ctx.arc(bx,by-53,3.4+firingGlow*2,0,6.28);ctx.fill();ctx.shadowBlur=0;}
  function drawDrone(dx){var by=GROUND;ctx.fillStyle='#1a2a2a';rr(dx-9,by-30,18,12,3);ctx.fill();ctx.fillStyle='#9affd0';ctx.shadowColor='#9affd0';ctx.shadowBlur=8;ctx.beginPath();ctx.arc(dx,by-24,2.5,0,6.28);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#3a5a5a';ctx.fillRect(dx-12,by-26,3,4);ctx.fillRect(dx+9,by-26,3,4);}
  function drawNozzle(){if(dead)return;var bx=headX,by=GROUND;var wide=powerW>0;var hot=powerRapid>0;var carW=wide?(56+wideAnim*44):56;ctx.fillStyle='#101018';ctx.fillRect(0,by-8,W,6);ctx.fillStyle='#2a2a36';for(var rx=6;rx<W;rx+=24){ctx.fillRect(rx,by-8,12,6);}if(droneT>0){drawDrone(bx-48);drawDrone(bx+48);}ctx.fillStyle='#0a0a12';rr(bx-carW/2,by-22,carW,22,5);ctx.fill();ctx.fillStyle='#2e2e3a';rr(bx-carW/2,by-22,carW,8,4);ctx.fill();ctx.fillStyle='#1a1a24';rr(bx-carW/2+3,by-14,carW-6,12,2);ctx.fill();ctx.fillStyle='#ff5a3c';ctx.shadowColor='#ff3815';ctx.shadowBlur=5;ctx.fillRect(bx-carW/2+5,by-12,3,8);ctx.fillRect(bx+carW/2-8,by-12,3,8);ctx.shadowBlur=0;if(wide){var sp=wideAnim;WIDE_OFF.forEach(function(o){nozzleBody(bx+o*sp,by,hot);});}else nozzleBody(bx,by,hot);if(shield>0){ctx.strokeStyle='rgba(62,166,255,'+(0.4+0.2*Math.sin(Date.now()/200))+')';ctx.lineWidth=2.5;ctx.shadowColor='#3ea6ff';ctx.shadowBlur=10;ctx.beginPath();ctx.arc(bx,by-24,Math.max(36,carW/2+14),Math.PI,0);ctx.stroke();ctx.shadowBlur=0;}}
  function drawBeam(b){var sy=GROUND-52;ctx.save();ctx.globalAlpha=b.life;ctx.strokeStyle=(pierceT>0?'rgba(255,226,74,':'rgba(255,56,21,')+(0.22*b.life)+')';ctx.lineWidth=b.w*4.5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(b.x,sy);ctx.lineTo(b.ty,0);ctx.stroke();ctx.strokeStyle=pierceT>0?'#ffe24a':'#ff3815';ctx.lineWidth=b.w*1.8;ctx.shadowColor=ctx.strokeStyle;ctx.shadowBlur=16;ctx.beginPath();ctx.moveTo(b.x,sy);ctx.lineTo(b.ty,0);ctx.stroke();ctx.strokeStyle='#fff';ctx.lineWidth=b.w*0.55;ctx.shadowBlur=0;ctx.beginPath();ctx.moveTo(b.x,sy);ctx.lineTo(b.ty,0);ctx.stroke();ctx.restore();}
  function drawEShot(es){ctx.save();if(es.kind==='missile'){ctx.translate(es.x,es.y);var ang=Math.atan2(es.vy,es.vx)+Math.PI/2;ctx.rotate(ang);ctx.shadowColor='#ff8a4a';ctx.shadowBlur=8;ctx.fillStyle='#ddd';ctx.beginPath();ctx.moveTo(0,-8);ctx.lineTo(3.5,4);ctx.lineTo(-3.5,4);ctx.closePath();ctx.fill();ctx.fillStyle='#ff5a3c';ctx.fillRect(-3,4,6,3);}else{ctx.shadowColor='#ff3b3b';ctx.shadowBlur=7;ctx.fillStyle='#ff5a3c';ctx.beginPath();ctx.arc(es.x,es.y,4,0,6.28);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(es.x,es.y,1.6,0,6.28);ctx.fill();}ctx.restore();ctx.shadowBlur=0;}
  function drawPowerHUD(){var list=[];if(powerRapid>0)list.push(['rapid',powerRapid/480]);if(powerW>0)list.push(['wide',powerW/480]);if(powerHome>0)list.push(['home',powerHome/420]);if(slowT>0)list.push(['slow',slowT/420]);if(pierceT>0)list.push(['pierce',pierceT/480]);if(droneT>0)list.push(['drone',droneT/540]);
    var x=8,y=8;list.forEach(function(it){var pk=it[0],pct=it[1],c=PW[pk].c,wd=58;ctx.fillStyle='rgba(10,10,18,.7)';rr(x,y,wd,15,4);ctx.fill();ctx.strokeStyle=c;ctx.lineWidth=1;rr(x,y,wd,15,4);ctx.stroke();ctx.fillStyle=c;ctx.font='9px monospace';ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillText(PW[pk].icon+PW[pk].label,x+4,y+7);ctx.fillStyle='rgba(255,255,255,.12)';ctx.fillRect(x+3,y+12,wd-6,2);ctx.fillStyle=c;ctx.fillRect(x+3,y+12,(wd-6)*pct,2);y+=19;});}
  function draw(){var ox=0,oy=0;if(shakeT>0){ox=R(-shakeT/2,shakeT/2);oy=R(-shakeT/3,shakeT/3);shakeT*=0.85;if(shakeT<0.4)shakeT=0;}ctx.setTransform(1,0,0,1,ox,oy);ctx.clearRect(-14,-14,W+28,H+28);
    for(var si=0;si<stars.length;si++){var st=stars[si];st.y+=st.v;if(st.y>GROUND)st.y=-2,st.x=R(0,W);ctx.globalAlpha=st.a;ctx.fillStyle='#6aa0ff';ctx.fillRect(st.x,st.y,st.s,st.s);}ctx.globalAlpha=1;
    ctx.strokeStyle='rgba(255,56,21,0.04)';ctx.lineWidth=1;for(var gx=0;gx<W;gx+=44){ctx.beginPath();ctx.moveTo(gx,0);ctx.lineTo(gx,GROUND);ctx.stroke();}
    ctx.fillStyle='#0a0610';ctx.fillRect(0,GROUND,W,H-GROUND);
    for(var i=0;i<foes.length;i++){var f=foes[i];if(f.dead)continue;if(f.type==='gold')drawGold(f);else if(f.type==='power')drawPowerItem(f);else drawFoe(f);}
    if(boss&&!boss.dead)drawBoss();
    for(i=0;i<eshots.length;i++)drawEShot(eshots[i]);
    for(i=0;i<missiles.length;i++)drawMissile(missiles[i]);
    for(i=0;i<beams.length;i++)drawBeam(beams[i]);
    for(i=parts.length-1;i>=0;i--){var p=parts[i];p.life-=0.032;if(p.life<=0){parts.splice(i,1);continue;}p.x+=p.vx;p.y+=p.vy;p.vy+=0.12;ctx.globalAlpha=p.life;ctx.fillStyle=p.col;ctx.fillRect(p.x-p.sz/2,p.y-p.sz/2,p.sz,p.sz);}ctx.globalAlpha=1;
    for(i=floats.length-1;i>=0;i--){var fl=floats[i];fl.life-=0.022;fl.y-=0.7;if(fl.life<=0){floats.splice(i,1);continue;}ctx.globalAlpha=Math.min(1,fl.life*1.5);ctx.fillStyle=fl.c;ctx.font='bold 14px monospace';ctx.textAlign='center';ctx.fillText(fl.txt,fl.x,fl.y);}ctx.globalAlpha=1;
    if(running&&!dead){var off=powerW>0?WIDE_OFF.map(function(o){return aimX+o*wideAnim;}):[aimX];ctx.strokeStyle='rgba(255,56,21,0.12)';ctx.setLineDash([4,8]);off.forEach(function(ax){ctx.beginPath();ctx.moveTo(ax,0);ctx.lineTo(ax,GROUND-52);ctx.stroke();});ctx.setLineDash([]);}
    headX+=(aimX-headX)*(isTouch?(sensLevel*0.1):0.35);drawNozzle();
    if(running&&!dead)drawPowerHUD();
    if(slowT>0){ctx.save();ctx.globalAlpha=Math.min(1,slowT/60)*0.85;drawSnail(W-30,18,22,'#7ad0ff');ctx.restore();}
    if(bannerLife>0){bannerLife-=0.011;ctx.globalAlpha=Math.min(1,bannerLife*2);var ib=banner.indexOf('⚠')>=0;var ic=ib?'#ff3b3b':(banner.indexOf('WAVE')>=0?'#3ea6ff':'#ffd24a');ctx.fillStyle=ic;ctx.font='bold 24px monospace';ctx.textAlign='center';ctx.shadowColor=ic;ctx.shadowBlur=18;ctx.fillText(banner,W/2,H/2-10);ctx.shadowBlur=0;ctx.globalAlpha=1;}
    if(dead){ctx.fillStyle='rgba(255,80,40,0.3)';ctx.fillRect(-14,-14,W+28,H+28);}
    if(flash>0){ctx.fillStyle='rgba(255,90,60,'+(flash*0.22)+')';ctx.fillRect(-14,-14,W+28,H+28);flash*=0.8;if(flash<0.02)flash=0;}
    if(slowT>0){ctx.fillStyle='rgba(60,140,255,0.06)';ctx.fillRect(-14,-14,W+28,H+28);}
    if(firingGlow>0){firingGlow*=0.82;if(firingGlow<0.02)firingGlow=0;}
    if(vig){ctx.fillStyle=vig;ctx.fillRect(0,0,W,H);}
    ctx.globalAlpha=0.06;ctx.fillStyle='#000';for(var sy2=0;sy2<H;sy2+=3){ctx.fillRect(0,sy2,W,1);}ctx.globalAlpha=1;
    ctx.setTransform(1,0,0,1,0,0);}
  function nearestTarget(m){var best=null,bd=1e9;for(var i=0;i<foes.length;i++){var f=foes[i];if(f.dead||f.type==='gold'||f.type==='power')continue;var d=Math.hypot(f.x-m.x,f.y-m.y);if(d<bd){bd=d;best=f;}}if(boss&&!boss.dead&&boss.y>0){var db=Math.hypot(boss.x-m.x,boss.y-m.y);if(db<bd){bd=db;best=boss;}}return best;}
  function stepLogic(){pulse=0.5+0.5*Math.sin(Date.now()/90);
    if(dead)return;
    if(moveDir!==0)aimX=Math.max(8,Math.min(W-8,aimX+moveDir*(isTouch?(sensLevel*2.6):6.5)));
    if(powerW>0&&wideAnim<1)wideAnim=Math.min(1,wideAnim+0.08);if(powerW<=0&&wideAnim>0)wideAnim=Math.max(0,wideAnim-0.08);
    if(powerRapid>0)powerRapid--;if(powerW>0)powerW--;if(powerHome>0)powerHome--;if(slowT>0)slowT--;if(pierceT>0)pierceT--;if(droneT>0)droneT--;if(fireCd>0)fireCd--;if(holding&&running)fire();
    var sf=slowT>0?0.45:1;
    for(var i=beams.length-1;i>=0;i--){beams[i].life-=0.22;if(beams[i].life<=0)beams.splice(i,1);}
    for(i=missiles.length-1;i>=0;i--){var m=missiles[i];m.life--;var tg=nearestTarget(m);if(tg){var dx=tg.x-m.x,dy=(tg.y||0)-m.y,d=Math.hypot(dx,dy)||1;m.vx+=(dx/d*m.spd-m.vx)*0.12;m.vy+=(dy/d*m.spd-m.vy)*0.12;}else{m.vy-=0.2;}m.x+=m.vx;m.y+=m.vy;parts.push({x:m.x,y:m.y,vx:R(-0.5,0.5),vy:R(0.5,1.5),life:0.5,col:'#ff5ad0',sz:2});var hitT=null;for(var j=0;j<foes.length;j++){var ff=foes[j];if(ff.dead||ff.type==='gold'||ff.type==='power')continue;if(Math.hypot(ff.x-m.x,ff.y-m.y)<ff.sz/2+6){hitT=ff;break;}}if(!hitT&&boss&&!boss.dead&&boss.y>0&&Math.hypot(boss.x-m.x,boss.y-m.y)<boss.sz/2+6)hitT='boss';if(hitT){missiles.splice(i,1);explode(m.x,m.y,'#ff5ad0',true);if(hitT==='boss')hitBoss(m.x);else damage(hitT,m.x);continue;}if(m.life<=0||m.y<-20||m.x<-20||m.x>W+20)missiles.splice(i,1);}
    var now=Date.now();
    for(i=foes.length-1;i>=0;i--){var f=foes[i];if(f.dead){foes.splice(i,1);continue;}var age=now-f.t0;var vy=f.vy*sf;
      if(f.mv==='straight'){f.y+=vy;f.x+=f.vx*sf;}
      else if(f.mv==='zigzag'){f.y+=vy;f.x=f.x0+(((age/f.freq)%2<1)?1:-1)*f.amp*0.5+Math.sin(age/(f.freq*0.4))*8;}
      else if(f.mv==='sine'){f.y+=vy;f.x=f.x0+Math.sin(age/f.freq+f.phase)*f.amp;}
      else if(f.mv==='sweep'){f.y+=vy*0.8;f.x+=f.sweepDir*(1.3+wave*0.08)*sf;if(f.x<f.sz/2||f.x>W-f.sz/2)f.sweepDir*=-1;}
      else if(f.mv==='dive'){f.y+=vy*(1+age/1100);f.x+=f.vx*sf;}
      else if(f.mv==='drift'){f.y+=vy*0.7;f.x=f.x0+Math.sin(age/f.freq+f.phase)*f.amp*0.6;}
      else if(f.mv==='circle'){f.y+=vy*0.7;f.x=f.x0+Math.cos(age/240+f.phase)*f.amp*0.8;}
      else if(f.mv==='pause'){var ph=Math.sin(age/450);f.y+=vy*(ph>0.3?0.15:1.5);f.x+=f.vx*sf;}
      else if(f.mv==='homing'){f.y+=vy;f.x+=(headX-f.x)*0.01*sf;}
      else{f.y+=vy;}
      if(f.x<f.sz/2)f.x=f.sz/2;if(f.x>W-f.sz/2)f.x=W-f.sz/2;
      if(f.shooter&&f.y>0&&f.y<GROUND-100){f.shootCd--;if(f.shootCd<=0){f.shootCd=Math.max(isTouch?115:75,(f.type==='scout'?235:180)-wave*4)+(isTouch?55:15);aimShot(f);}}
      var isItem=(f.type==='gold'||f.type==='power');
      if(f.y+f.sz*0.3>=GROUND-NOZ_TOP&&Math.abs(f.x-headX)<=NOZ_HW+f.sz*(isItem?0.55:0.45)){if(isItem){f.dead=true;gainItem(f);continue;}f.dead=true;explode(f.x,f.y,'#ff5a3c',true);snd('hit');playerHit();if(dead)return;continue;}
      if(f.y>GROUND+f.sz*0.5){foes.splice(i,1);if(!isItem){playerHit();if(dead)return;}}
    }
    if(boss){if(boss.entering){boss.y+=2;if(boss.y>=boss.baseY){boss.y=boss.baseY;boss.entering=false;}}
      else{boss.mt++;var t=boss.mt,bt=boss.bt,hw=boss.sz/2;
        if(bt===0){boss.x=W/2+Math.sin(t/62)*(W/2-hw-10);boss.y=boss.baseY+Math.sin(t/95)*18;}
        else if(bt===1){boss.x+=boss.vx*sf;if(boss.x<hw||boss.x>W-hw)boss.vx*=-1;boss.y=boss.baseY+(t%160<14?-7:0);}
        else if(bt===2){boss.x=W/2+Math.sin(t/56)*(W/2-hw-14);boss.y=boss.baseY+Math.sin(t/28)*30;}
        else{if(boss.diveT>0){boss.diveT--;var dp=1-boss.diveT/40;boss.y=boss.baseY+Math.sin(dp*Math.PI)*200;boss.x+=boss.vx*0.4*sf;if(boss.x<hw||boss.x>W-hw)boss.vx*=-1;}else{boss.y=boss.baseY;boss.x+=boss.vx*sf;if(boss.x<hw||boss.x>W-hw)boss.vx*=-1;if(Math.random()<0.012)boss.diveT=40;}}
        if(boss.y>GROUND-80)boss.y=GROUND-80;if(boss.y<10)boss.y=10;
        boss.shootCd--;if(boss.shootCd<=0){boss.shootCd=Math.max(isTouch?54:36,(isTouch?98:76)-wave*3);bossShoot();}}}
    for(i=eshots.length-1;i>=0;i--){var es=eshots[i];es.x+=es.vx*sf;es.y+=es.vy*sf;if(es.y>=GROUND-NOZ_TOP&&es.y<=GROUND-2&&Math.abs(es.x-headX)<=NOZ_HW){eshots.splice(i,1);playerHit();if(dead)return;continue;}if(es.y>GROUND+4||es.x<-12||es.x>W+12)eshots.splice(i,1);}
    if(running&&!bossActive&&!dead&&foes.length===0){noFoeT++;if(noFoeT>40){spawn();noFoeT=0;}}
  }
  function bossShoot(){var b=boss;b.pat++;if(b.bt===0){var m=b.pat%3;if(m===0){var dx0=headX-b.x,dy0=GROUND-b.y,d0=Math.hypot(dx0,dy0)||1;eShot(b.x,b.y+b.sz/3,dx0/d0*3.4,dy0/d0*3.4,'missile');}else if(m===1){for(var k=-1;k<=1;k++)eShot(b.x+k*16,b.y+b.sz/3,k*1.4,3+wave*0.1,'bullet');}else{var dx=headX-b.x,dy=GROUND-b.y,d=Math.hypot(dx,dy)||1;eShot(b.x,b.y+b.sz/3,dx/d*3.4,dy/d*3.4,'missile');}}else if(b.bt===1){for(var k2=-2;k2<=2;k2++)eShot(b.x+k2*12,b.y+b.sz/3,k2*1.0,3+wave*0.08,'bullet');}else if(b.bt===2){var base=b.pat*0.4;for(var s=0;s<6;s++){var a=base+s*1.047;eShot(b.x,b.y,Math.cos(a)*2.4,Math.abs(Math.sin(a))*2.4+1.3,'bullet');}}else{var dx2=headX-b.x,dy2=GROUND-b.y,d2=Math.hypot(dx2,dy2)||1;eShot(b.x-20,b.y+b.sz/3,dx2/d2*3.5,dy2/d2*3.5,'missile');eShot(b.x+20,b.y+b.sz/3,dx2/d2*3.5,dy2/d2*3.5,'missile');}}
  function frame(){if(!running)return;stepLogic();draw();raf=requestAnimationFrame(frame);}
  function initStars(){stars=[];for(var i=0;i<64;i++)stars.push({x:R(0,W),y:R(0,GROUND),v:R(0.4,1.6),s:R(1,2),a:R(0.06,0.3)});}
  function mkVig(){var g=ctx.createRadialGradient(W/2,H/2,H*0.35,W/2,H/2,H*0.75);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,0.45)');vig=g;}
  function loc(e){var r=cv.getBoundingClientRect();return Math.max(8,Math.min(W-8,(e.clientX-r.left)*(W/r.width)));}
  if(!isTouch){
    window.addEventListener('pointermove',function(e){if(!running||dead)return;aimX=loc(e);});
    window.addEventListener('pointerdown',function(e){if(e.target&&e.target.closest&&e.target.closest('button'))return;aimX=loc(e);ac();if(running&&!dead){holding=true;fire();}});
    window.addEventListener('pointerup',function(){holding=false;});
    if(howto)howto.innerHTML='마우스로 이동 · 클릭으로 발사';
  }else{
    if(howto)howto.innerHTML='게임 화면을 손가락으로 밀어 이동 · 버튼으로 발사';
    // 화면(캔버스)을 직접 드래그 → 노즐이 손가락 위치로 정확히 즉시 이동 (밀림 없음)
    var dragging=false,dId=null;
    function setAim(e){aimX=loc(e);}
    cv.addEventListener('pointerdown',function(e){e.preventDefault();ac();dragging=true;dId=e.pointerId;setAim(e);try{cv.setPointerCapture(e.pointerId);}catch(_){}});
    cv.addEventListener('pointermove',function(e){if(!dragging||e.pointerId!==dId)return;e.preventDefault();setAim(e);});
    var dE=function(e){if(e&&dId!=null&&e.pointerId!==dId)return;dragging=false;dId=null;};
    cv.addEventListener('pointerup',dE);cv.addEventListener('pointercancel',dE);cv.addEventListener('pointerleave',dE);
    // 보조 조이스틱도 동작 유지(원하면 사용)
    var jA=false,jId=null,jx=0,mr=30;
    function setS(dx){var cl=Math.max(-mr,Math.min(mr,dx));stick.style.transform='translateX('+cl+'px)';moveDir=(cl===0?0:Math.sign(cl)*Math.min(1,Math.abs(cl)/mr*1.7));}
    if(joy){
      joy.addEventListener('pointerdown',function(e){e.preventDefault();ac();jA=true;jId=e.pointerId;jx=e.clientX;setS(0);try{joy.setPointerCapture(e.pointerId);}catch(_){}});
      joy.addEventListener('pointermove',function(e){if(!jA||e.pointerId!==jId)return;e.preventDefault();setS(e.clientX-jx);});
      var jE=function(){jA=false;jId=null;moveDir=0;stick.style.transform='translateX(0)';};
      joy.addEventListener('pointerup',jE);joy.addEventListener('pointercancel',jE);
    }
    var fp=function(e){e.preventDefault();ac();holding=true;fire();fireBtn.style.transform='scale(.94)';};
    var fr=function(e){e.preventDefault();holding=false;fireBtn.style.transform='';};
    fireBtn.addEventListener('pointerdown',fp);fireBtn.addEventListener('pointerup',fr);fireBtn.addEventListener('pointerleave',fr);fireBtn.addEventListener('pointercancel',fr);
  }
  function start(){ac();bgmPlay();score=0;combo=0;mult=1;hp=4;wave=1;kills=0;killNeed=12;spawnMs=isTouch?1280:1140;powerRapid=0;powerW=0;shield=0;powerHome=0;slowT=0;pierceT=0;droneT=0;fireCd=0;firingGlow=0;wideAnim=0;moveDir=0;bossActive=false;dead=false;running=true;foes=[];beams=[];parts=[];floats=[];eshots=[];missiles=[];boss=null;noFoeT=0;initStars();scEl.textContent=0;wvEl.textContent=1;cbEl.style.opacity='0';setHp();menu.style.display='none';over.style.display='none';if(isTouch)pad.style.display='block';restartSpawn();cancelAnimationFrame(raf);raf=requestAnimationFrame(frame);}
  function endGame(){running=false;clearInterval(spawnT);bgmStop();var top=saveScore(score);var isNew=(top.indexOf(score)===0&&score>0);var rk=score>=1500?'★★★ 에이스 파일럿':score>=700?'★★ 정예 사수':score>=300?'★ 견습 사수':'신참 — 다시!';fsc.textContent=score;fwv.textContent=wave;rankEl.textContent=rk;newhi.style.display=isNew?'block':'none';renderBoard(board2,score);over.style.display='flex';if(isTouch)pad.style.display='none';}
  window.__glStop=function(){running=false;clearInterval(spawnT);cancelAnimationFrame(raf);holding=false;moveDir=0;bgmStop();};
  window.__glReset=function(){running=false;dead=false;clearInterval(spawnT);cancelAnimationFrame(raf);holding=false;moveDir=0;bgmStop();foes=[];beams=[];parts=[];floats=[];eshots=[];missiles=[];boss=null;bossActive=false;hp=4;score=0;wave=1;scEl.textContent=0;wvEl.textContent=1;cbEl.style.opacity='0';setHp();over.style.display='none';menu.style.display='flex';if(isTouch)pad.style.display='none';renderBoard(board,null);draw();};
  // ── 설정: 감도 슬라이더 + 소리 토글 ──
  if(sensEl){ sensEl.addEventListener('input',function(){ sensLevel=parseInt(sensEl.value,10)||4; if(sensVEl)sensVEl.textContent=sensLevel; }); }
  if(sndBtn){ sndBtn.addEventListener('click',function(){ sndOn=!sndOn; sndBtn.textContent=sndOn?'🔊 ON':'🔇 OFF'; sndBtn.style.background=sndOn?'linear-gradient(180deg,#ff5a3c,#ff3815)':'linear-gradient(180deg,#555,#333)'; applySound(); if(sndOn&&running)bgmPlay(); else if(!sndOn)bgmStop(); }); }
  // ── 핸드폰을 닫거나 다른 앱으로 가면 게임 종료 ──
  document.addEventListener('visibilitychange',function(){ if(document.hidden&&running&&!dead){ blowUpPlayer(); } });
  $('L_start').addEventListener('click',start);$('L_again').addEventListener('click',start);
  mkVig();initStars();setHp();renderBoard(board,null);draw();
})();
