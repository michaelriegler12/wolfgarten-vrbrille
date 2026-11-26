/* Wolfgarten-Challenge – Startmaske, Siegerehrung und Urkunde */
(function () {
  'use strict';
  var config = window.WOLF_STUDENT_CONFIG;
  if (!config || !Array.isArray(config.tasks)) return;
  var tasks = config.tasks;
  var key = 'wolfgarten-challenge-v1';
  var blue = '#24417B', green = '#83AB2E', cream = '#F2E6CA';
  var style = document.createElement('style');
  style.textContent = `
    #wgOverlay{position:fixed;inset:0;z-index:20000;background:rgba(0,0,0,.76);display:flex;align-items:center;justify-content:center;padding:14px;box-sizing:border-box;font-family:Arial,Helvetica,sans-serif;overflow-y:auto}
    #wgOverlay[hidden]{display:none!important}
    #wgPanel{width:min(100%,750px);max-height:calc(100dvh - 28px);overflow-y:auto;background:#F2E6CA;color:#24417B;border-radius:24px;padding:clamp(18px,3vw,32px);box-sizing:border-box;text-align:center;box-shadow:0 14px 55px #0008}
    #wgPanel h1{font-size:clamp(25px,3vw,35px);margin:0 0 22px;font-weight:750;line-height:1.2}
    #wgPanel p{font-size:clamp(16px,2vw,20px);line-height:1.45;margin:10px 0 20px}
    #wgPanel .wgLead{font-weight:600}
    #wgPanel .wgList{background:#fff;border-radius:20px;padding:8px 18px;margin:20px 0;text-align:left}
    #wgPanel .wgLine{display:flex;align-items:center;gap:15px;padding:18px 0;border-bottom:1px solid #e9e9e9;color:#171717}
    #wgPanel .wgLine:last-child{border-bottom:0}
    #wgPanel .wgIcon{display:grid;place-items:center;flex:0 0 45px;width:45px;height:45px;border-radius:14px;background:#E7FFB1;color:#24417B;font-size:24px}
    #wgPanel .wgLineText{flex:1;min-width:0}
    #wgPanel .wgLineText strong{display:block;font-size:18px}
    #wgPanel .wgLineText small{display:block;color:#666;font-size:14px;margin-top:5px}
    #wgPanel .wgValue{font-size:23px;color:#24417B;font-weight:800}
    #wgPanel button{border:0;border-radius:13px;padding:15px 20px;font-size:18px;font-weight:700;cursor:pointer;font-family:inherit}
    #wgPanel button:focus-visible,#wgFinish:focus-visible{outline:3px solid #83AB2E;outline-offset:3px}
    #wgPanel .wgPrimary{background:#24417B;color:white;width:100%}
    #wgPanel .wgGreen{background:#83AB2E;color:white}
    #wgPanel .wgResultCard{background:#fff;border-radius:20px;padding:22px;margin:18px 0}
    #wgPanel .wgMedal{font-size:42px;margin:4px 0 12px}
    #wgPanel .wgResultCard h2{font-size:26px;margin:0 0 16px}
    #wgPanel .wgScore{font-size:40px;font-weight:800;margin:14px 0}
    #wgPanel .wgCertificate{background:#fff;border:3px solid #83AB2E;border-radius:18px;padding:24px 12px;margin:18px 0}
    #wgPanel .wgCertificate h2{font-size:25px;margin:15px 0}
    #wgPanel .wgCertificate p{margin:12px 0}
    #wgPanel .wgButtons{display:grid;grid-template-columns:1fr 1fr;gap:12px}
    #wgPanel input{width:min(100%,370px);box-sizing:border-box;padding:12px;border:2px solid #8793BC;border-radius:9px;background:white;color:#24417B;font-size:17px;text-align:center;margin:0 0 14px}
    #wgFinish{position:fixed;right:70px;bottom:20px;z-index:1100;background:#83AB2E;color:#24417B;border:2px solid #CEE697;border-radius:100px;padding:11px 18px;font:bold 14px Arial,sans-serif;cursor:pointer;box-shadow:0 5px 18px #0005}
    @media(max-width:600px){#wgPanel .wgButtons{grid-template-columns:1fr}#wgPanel .wgLine{gap:9px}#wgPanel .wgLineText strong{font-size:16px}#wgPanel .wgValue{font-size:19px}#wgFinish{right:12px;bottom:80px;padding:9px 12px;font-size:12px}}
  `;
  document.head.appendChild(style);

  var overlay = document.createElement('div');
  overlay.id = 'wgOverlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  var panel = document.createElement('div');
  panel.id = 'wgPanel';
  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  var finish = document.createElement('button');
  finish.id = 'wgFinish';
  finish.type = 'button';
  finish.textContent = '🏅 Challenge beenden';
  finish.addEventListener('click', showResult);
  document.body.appendChild(finish);

  function button(text, className, action) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = className;
    b.textContent = text;
    b.addEventListener('click', action);
    return b;
  }
  function open() { overlay.hidden = false; finish.hidden = true; }
  function close() { overlay.hidden = true; finish.hidden = false; }
  function readDone() {
    try { return JSON.parse(localStorage.getItem(key) || '{}') || {}; }
    catch (e) { return {}; }
  }
  function points(task) { return task.type === 'info' ? 0 : (task.type === 'quiz' ? (task.points === undefined ? 10 : Number(task.points) || 0) : 5); }
  function result() {
    var done = readDone(), score = 0, discovered = 0;
    tasks.forEach(function (task, i) {
      if (task.type === 'info') return;
      if (done[i]) discovered++;
      if (done[i] === true) score += points(task);
    });
    return {score: score, discovered: discovered, total: tasks.filter(function(t) { return t.type !== 'info'; }).length};
  }
  function medal(score) {
    if (score >= 120) return {icon:'🥇', label:'Goldmedaille'};
    if (score >= 80) return {icon:'🥈', label:'Silbermedaille'};
    return {icon:'🥉', label:'Bronzemedaille'};
  }
  function showIntro() {
    panel.replaceChildren();
    var title = document.createElement('h1');
    title.textContent = ' Wolfgarten-Challenge';
    panel.appendChild(title);
    var welcome = document.createElement('p');
    welcome.textContent = 'Willkommen im Gymnasium Wolfgarten!';
    panel.appendChild(welcome);
    var lead = document.createElement('p');
    lead.className = 'wgLead';
    lead.textContent = 'Erkunde unsere Schule und entdecke ' + tasks.filter(function(t) { return t.type !== 'info'; }).length + ' versteckte Aufgaben. Sammle möglichst viele Punkte!';
    panel.appendChild(lead);
    var list = document.createElement('div');
    list.className = 'wgList';
    [['◎','Coins sammeln','Finde versteckte Münzen.','+5'],['ⓘ','Infotafeln entdecken','Erfahre mehr über unsere Schule.','Info'],['?','Quizfragen beantworten','Beantworte Fragen richtig.','+10']].forEach(function (entry) {
      var line = document.createElement('div'); line.className = 'wgLine';
      var ico = document.createElement('span'); ico.className = 'wgIcon'; ico.textContent = entry[0];
      var txt = document.createElement('div'); txt.className = 'wgLineText';
      var strong = document.createElement('strong'); strong.textContent = entry[1];
      var small = document.createElement('small'); small.textContent = entry[2];
      txt.append(strong,small);
      var val = document.createElement('span'); val.className = 'wgValue'; val.textContent = entry[3];
      line.append(ico,txt,val); list.appendChild(line);
    });
    panel.appendChild(list);
    panel.appendChild(button('▶ Los geht’s!', 'wgPrimary', close));
    open();
  }
  function showResult() {
    var r = result(), m = medal(r.score);
    panel.replaceChildren();
    var title = document.createElement('h1'); title.textContent = '🎉 Challenge geschafft!';
    var intro = document.createElement('p'); intro.textContent = 'Du hast den Wolfgarten erkundet!';
    panel.append(title,intro);
    var card = document.createElement('div'); card.className = 'wgResultCard';
    var medalEl = document.createElement('div'); medalEl.className = 'wgMedal'; medalEl.textContent = m.icon;
    var medalTitle = document.createElement('h2'); medalTitle.textContent = m.label;
    var score = document.createElement('div'); score.className = 'wgScore'; score.textContent = r.score + ' Punkte';
    var progress = document.createElement('p'); progress.textContent = r.discovered + ' von ' + r.total + ' Aufgaben entdeckt';
    card.append(medalEl,medalTitle,score,progress); panel.appendChild(card);
    var cert = document.createElement('div'); cert.className = 'wgCertificate';
    cert.innerHTML = '<h2>WOLFGARTEN-URKUNDE</h2><p>Herzlichen Glückwunsch!</p><p>Du bist jetzt offiziell ein</p><p><strong>Wolfgarten-Entdecker!</strong></p><p style="font-size:14px">Gymnasium Wolfgarten · Tag der offenen Tür</p>';
    
    var schoolLogo = document.createElement('img');
    schoolLogo.src = 'img/wolfgarten-logo.gif';
    schoolLogo.alt = 'Gymnasium Wolfgarten';
    schoolLogo.style.cssText =
      'display:block;width:min(85%,380px);height:auto;object-fit:contain;margin:0 auto 15px';

    var wolfLogo = document.createElement('img');
    wolfLogo.src = 'img/wolfgarten-wolf.png';
    wolfLogo.alt = 'Wolfgarten-Wolf';
    wolfLogo.style.cssText =
      'display:block;width:100px;height:100px;object-fit:contain;margin:12px auto';

    cert.insertBefore(schoolLogo, cert.firstChild);
    cert.insertBefore(wolfLogo, cert.querySelector('h2'));
    panel.appendChild(cert);

    var label = document.createElement('label'); label.textContent = 'Dein Name für die Urkunde:'; label.style.display = 'block'; label.style.marginBottom = '7px';
    var input = document.createElement('input'); input.type = 'text'; input.maxLength = 60; input.placeholder = 'Vorname und Nachname'; input.autocomplete = 'off';
    panel.append(label,input);
    var actions = document.createElement('div'); actions.className = 'wgButtons';
    actions.appendChild(button('↓ Urkunde speichern', 'wgPrimary', function () { saveCertificate(input.value.trim(),r,m); }));
    actions.appendChild(button('↻ Neu starten', 'wgGreen', function () {
      if (!confirm('Wirklich alle Punkte und Antworten löschen und neu beginnen?')) return;
      localStorage.removeItem(key);
      window.location.reload();
    }));
    panel.appendChild(actions);
    var back = button('← Weiter erkunden', '', close);
    back.style.cssText = 'margin-top:12px;background:transparent;color:#24417B;font-size:15px';
    panel.appendChild(back);
    open();
  }

  function saveCertificate(name, r, m) {
    var logo = new Image();
    var wolf = new Image();

    function loadImage(img, src) {
      return new Promise(function(resolve, reject) {
        img.onload = resolve;
        img.onerror = reject;
        img.src = src;
      });
    }

    Promise.all([
      loadImage(logo, 'img/wolfgarten-logo.gif'),
      loadImage(wolf, 'img/wolfgarten-wolf.png')
    ]).then(function() {

      var canvas = document.createElement('canvas');
      canvas.width = 1600;
      canvas.height = 1130;

      var ctx = canvas.getContext('2d');

      var blue = '#24417B';
      var green = '#83AB2E';
      var cream = '#F2E6CA';

      // Hintergrund
      ctx.fillStyle = cream;
      ctx.fillRect(0, 0, 1600, 1130);

      // Urkundenfläche
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(75, 65, 1450, 1000);

      // Grüner Rahmen
      ctx.strokeStyle = green;
      ctx.lineWidth = 9;
      ctx.strokeRect(95, 85, 1410, 960);

      // Original-Schullogo, proportional skaliert
      function drawContained(img, x, y, w, h) {
        var scale = Math.min(w / img.width, h / img.height);
        var dw = img.width * scale;
        var dh = img.height * scale;

        ctx.drawImage(
          img,
          x + (w - dw) / 2,
          y + (h - dh) / 2,
          dw,
          dh
        );
      }

      drawContained(logo, 370, 115, 860, 200);

      // Titel
      ctx.fillStyle = blue;
      ctx.textAlign = 'center';
      ctx.font = 'bold 67px Arial';
      ctx.fillText('WOLFGARTEN-URKUNDE', 800, 370);

      // Wolfskopf als Original-Emblem
      drawContained(wolf, 665, 400, 270, 225);

      ctx.font = '38px Arial';
      ctx.fillText('Herzlichen Glückwunsch!', 800, 665);

      // Name
      ctx.font = 'bold 55px Arial';
      ctx.fillText(
        name || 'Wolfgarten-Entdecker/in',
        800,
        745,
        1220
      );

      ctx.font = '32px Arial';
      ctx.fillText(
        'Du bist jetzt offiziell ein Wolfgarten-Entdecker!',
        800,
        805,
        1270
      );

      // Medaille und Punkte
      ctx.fillStyle = green;
      ctx.font = 'bold 47px Arial';
      ctx.fillText(
        m.label + '  ·  ' + r.score + ' Punkte',
        800,
        885
      );

      ctx.fillStyle = blue;
      ctx.font = '29px Arial';
      ctx.fillText(
        r.discovered + ' von ' + r.total + ' Aufgaben entdeckt',
        800,
        935
      );

      // Abschluss
      ctx.strokeStyle = '#CEE697';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(410, 970);
      ctx.lineTo(1190, 970);
      ctx.stroke();

      ctx.font = '25px Arial';
      ctx.fillText(
        'Gymnasium Wolfgarten · Tag der offenen Tür',
        800,
        1010
      );

      // PNG speichern
      var link = document.createElement('a');
      link.download = 'Wolfgarten-Urkunde.png';
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      link.remove();

    }).catch(function(error) {
      console.error('Urkundenlogos konnten nicht geladen werden:', error);
      alert('Die Logos konnten nicht geladen werden. Bitte prüfe den img-Ordner.');
    });
  }


  showIntro();
})();
