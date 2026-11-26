
/* WOLFGARTEN OEFFENTLICHE RAUMNAMEN */
const wolfPublicRoomNames = {
  "0-1stockgangreligionsraum": "Gang im 1. Stock",
  "1-2stockgang": "Gang im 2. Stock",
  "2-2stockgangsprachenraum": "Gang bei den Sprachenräumen",
  "3-3stockgang": "Gang im 3. Stock",
  "4-arztzimmer": "Arztzimmer",
  "5-aufenthaltsraum": "Aufenthaltsraum",
  "6-aufgangauen": "Aufgang zum Außenbereich",
  "7-aueneingang": "Außeneingang",
  "8-bibliothek": "Bibliothek",
  "9-bibliothek2": "Bibliothek",
  "10-buffet": "Buffet",
  "11-chemiesaal": "Chemiesaal",
  "12-erdgeschoss_gangedv": "Gang im Erdgeschoss",
  "13-gangdirektion": "Gang zur Direktion",
  "14-gangkeller": "Gang im Untergeschoss",
  "15-gangkuche": "Gang zur Küche",
  "16-gangphysik": "Gang zum Physiksaal",
  "17-gangzeichmusiksaal": "Gang zu Musik und Zeichnen",
  "18-haupteingang": "Haupteingang",
  "19-ikt": "IKT-Raum",
  "20-lernwaben1": "Lernwaben",
  "21-mausoleum": "Mausoleum",
  "22-musiksaal": "Musiksaal",
  "23-outdoorklasse": "Outdoor-Klasse",
  "24-physiksaal1": "Physiksaal",
  "25-religionsraum1": "Religionsraum",
  "26-sekretariat1": "Sekretariat",
  "27-speisesaal1": "Speisesaal",
  "28-sportplatz": "Sportplatz",
  "29-sprachenraum": "Sprachenraum",
  "30-tischfussball": "Tischfußball",
  "31-tischtennis": "Tischtennis",
  "32-turnsaal": "Turnsaal",
  "33-werksaal": "Werksaal",
  "34-zeichensaal": "Zeichensaal",
  "35-1stocksitzeckeneu": "Sitzecke im 1. Stock",
  "36-direktionneu": "Direktion"
};

if (typeof APP_DATA !== 'undefined' && Array.isArray(APP_DATA.scenes)) {
  APP_DATA.scenes.forEach(function(scene) {
    if (Object.prototype.hasOwnProperty.call(wolfPublicRoomNames, scene.id)) {
      scene.name = wolfPublicRoomNames[scene.id];
    }
  });
}

/*
 * Copyright 2016 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

(function() {
  var Marzipano = window.Marzipano;
  var bowser = window.bowser;
  var screenfull = window.screenfull;
  var data = window.APP_DATA;

  // Grab elements from DOM.
  var panoElement = document.querySelector('#pano');
  var sceneNameElement = document.querySelector('#titleBar .sceneName');
  var sceneListElement = document.querySelector('#sceneList');
  var sceneElements = document.querySelectorAll('#sceneList .scene');
  var sceneListToggleElement = document.querySelector('#sceneListToggle');
  var autorotateToggleElement = document.querySelector('#autorotateToggle');
  var fullscreenToggleElement = document.querySelector('#fullscreenToggle');

  // Detect desktop or mobile mode.
  if (window.matchMedia) {
    var setMode = function() {
      if (mql.matches) {
        document.body.classList.remove('desktop');
        document.body.classList.add('mobile');
      } else {
        document.body.classList.remove('mobile');
        document.body.classList.add('desktop');
      }
    };
    var mql = matchMedia("(max-width: 500px), (max-height: 500px)");
    setMode();
    mql.addListener(setMode);
  } else {
    document.body.classList.add('desktop');
  }

  // Detect whether we are on a touch device.
  document.body.classList.add('no-touch');
  window.addEventListener('touchstart', function() {
    document.body.classList.remove('no-touch');
    document.body.classList.add('touch');
  });

  // Use tooltip fallback mode on IE < 11.
  if (bowser.msie && parseFloat(bowser.version) < 11) {
    document.body.classList.add('tooltip-fallback');
  }

  // Viewer options.
  var viewerOpts = {
    controls: {
      mouseViewMode: data.settings.mouseViewMode
    }
  };

  // Initialize viewer.
  var viewer = new Marzipano.Viewer(panoElement, viewerOpts);

  // Create scenes.
  var scenes = data.scenes.map(function(data) {
    var urlPrefix = "tiles";
    var source = Marzipano.ImageUrlSource.fromString(
      urlPrefix + "/" + data.id + "/{z}/{f}/{y}/{x}.jpg",
      { cubeMapPreviewUrl: urlPrefix + "/" + data.id + "/preview.jpg" });
    var geometry = new Marzipano.CubeGeometry(data.levels);

    var limiter = Marzipano.RectilinearView.limit.traditional(data.faceSize, 100*Math.PI/180, 120*Math.PI/180);
    var view = new Marzipano.RectilinearView(data.initialViewParameters, limiter);

    var scene = viewer.createScene({
      source: source,
      geometry: geometry,
      view: view,
      pinFirstLevel: true
    });

    // Create link hotspots.
    data.linkHotspots.forEach(function(hotspot) {
      var element = createLinkHotspotElement(hotspot);
      scene.hotspotContainer().createHotspot(element, { yaw: hotspot.yaw, pitch: hotspot.pitch });
    });

    // Create info hotspots.
    data.infoHotspots.forEach(function(hotspot) {
      var element = createInfoHotspotElement(hotspot);
      scene.hotspotContainer().createHotspot(element, { yaw: hotspot.yaw, pitch: hotspot.pitch });
    });

    return {
      data: data,
      scene: scene,
      view: view
    };
  });

  // Set up autorotate, if enabled.
  var autorotate = Marzipano.autorotate({
    yawSpeed: 0.03,
    targetPitch: 0,
    targetFov: Math.PI/2
  });
  if (false) { // Wolfgarten: Autorotation dauerhaft deaktiviert
    autorotateToggleElement.classList.add('enabled');
  }

  // Set handler for autorotate toggle.
  autorotateToggleElement.style.display = 'none';

  // Set up fullscreen mode, if supported.
  if (screenfull.enabled && data.settings.fullscreenButton) {
    document.body.classList.add('fullscreen-enabled');
    fullscreenToggleElement.addEventListener('click', function() {
      screenfull.toggle();
    });
    screenfull.on('change', function() {
      if (screenfull.isFullscreen) {
        fullscreenToggleElement.classList.add('enabled');
      } else {
        fullscreenToggleElement.classList.remove('enabled');
      }
    });
  } else {
    document.body.classList.add('fullscreen-disabled');
  }

  // Set handler for scene list toggle.
  sceneListToggleElement.addEventListener('click', toggleSceneList);

  // Start with the scene list open on desktop.
  if (!document.body.classList.contains('mobile')) {
    showSceneList();
  }

  // Set handler for scene switch.
  scenes.forEach(function(scene) {
    var el = document.querySelector('#sceneList .scene[data-id="' + scene.data.id + '"]');
    if (!el) {
      console.warn('Raum fehlt in der Raumliste:', scene.data.id);
      return;
    }
    el.addEventListener('click', function() {
      switchScene(scene);
      // On mobile, hide scene list after selecting a scene.
      if (document.body.classList.contains('mobile')) {
        hideSceneList();
      }
    });
  });

  // DOM elements for view controls.
  var viewUpElement = document.querySelector('#viewUp');
  var viewDownElement = document.querySelector('#viewDown');
  var viewLeftElement = document.querySelector('#viewLeft');
  var viewRightElement = document.querySelector('#viewRight');
  var viewInElement = document.querySelector('#viewIn');
  var viewOutElement = document.querySelector('#viewOut');

  // Dynamic parameters for controls.
  var velocity = 0.7;
  var friction = 3;

  // Associate view controls with elements.
  var controls = viewer.controls();
  controls.registerMethod('upElement',    new Marzipano.ElementPressControlMethod(viewUpElement,     'y', -velocity, friction), true);
  controls.registerMethod('downElement',  new Marzipano.ElementPressControlMethod(viewDownElement,   'y',  velocity, friction), true);
  controls.registerMethod('leftElement',  new Marzipano.ElementPressControlMethod(viewLeftElement,   'x', -velocity, friction), true);
  controls.registerMethod('rightElement', new Marzipano.ElementPressControlMethod(viewRightElement,  'x',  velocity, friction), true);
  controls.registerMethod('inElement',    new Marzipano.ElementPressControlMethod(viewInElement,  'zoom', -velocity, friction), true);
  controls.registerMethod('outElement',   new Marzipano.ElementPressControlMethod(viewOutElement, 'zoom',  velocity, friction), true);

  function sanitize(s) {
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;');
  }

  function switchScene(scene) {
    stopAutorotate();
    scene.view.setParameters(scene.data.initialViewParameters);
    scene.scene.switchTo();
    viewer.stopMovement();
    viewer.setIdleMovement(Infinity);
    updateSceneName(scene);
    updateSceneList(scene);
  }

  function updateSceneName(scene) {
    sceneNameElement.innerHTML = sanitize(scene.data.name);
  }

  function updateSceneList(scene) {
    for (var i = 0; i < sceneElements.length; i++) {
      var el = sceneElements[i];
      if (el.getAttribute('data-id') === scene.data.id) {
        el.classList.add('current');
      } else {
        el.classList.remove('current');
      }
    }
  }

  function showSceneList() {
    sceneListElement.classList.add('enabled');
    sceneListToggleElement.classList.add('enabled');
  }

  function hideSceneList() {
    sceneListElement.classList.remove('enabled');
    sceneListToggleElement.classList.remove('enabled');
  }

  function toggleSceneList() {
    sceneListElement.classList.toggle('enabled');
    sceneListToggleElement.classList.toggle('enabled');
  }

  function startAutorotate() {
    return; // Wolfgarten: keine automatische Drehung
    if (!autorotateToggleElement.classList.contains('enabled')) {
      return;
    }
    viewer.startMovement(autorotate);
    viewer.setIdleMovement(3000, autorotate);
  }

  function stopAutorotate() {
    viewer.stopMovement();
    viewer.setIdleMovement(Infinity);
  }

  function toggleAutorotate() {
    if (autorotateToggleElement.classList.contains('enabled')) {
      autorotateToggleElement.classList.remove('enabled');
      stopAutorotate();
    } else {
      autorotateToggleElement.classList.add('enabled');
      startAutorotate();
    }
  }

  function createLinkHotspotElement(hotspot) {

    // Create wrapper element to hold icon and tooltip.
    var wrapper = document.createElement('div');
    wrapper.classList.add('hotspot');
    wrapper.classList.add('link-hotspot');

    // Create image element.
    var icon = document.createElement('img');
    icon.src = 'img/link.png';
    icon.classList.add('link-hotspot-icon');

    // Set rotation transform.
    var transformProperties = [ '-ms-transform', '-webkit-transform', 'transform' ];
    for (var i = 0; i < transformProperties.length; i++) {
      var property = transformProperties[i];
      icon.style[property] = 'rotate(' + hotspot.rotation + 'rad)';
    }

    // Add click event handler.
    wrapper.addEventListener('click', function() {
      switchScene(findSceneById(hotspot.target));
    });

    // Prevent touch and scroll events from reaching the parent element.
    // This prevents the view control logic from interfering with the hotspot.
    stopTouchAndScrollEventPropagation(wrapper);

    // Create tooltip element.
    var tooltip = document.createElement('div');
    tooltip.classList.add('hotspot-tooltip');
    tooltip.classList.add('link-hotspot-tooltip');
    tooltip.innerHTML = findSceneDataById(hotspot.target).name;

    wrapper.appendChild(icon);
    wrapper.appendChild(tooltip);

    return wrapper;
  }

  function createInfoHotspotElement(hotspot) {

    // Create wrapper element to hold icon and tooltip.
    var wrapper = document.createElement('div');
    wrapper.classList.add('hotspot');
    wrapper.classList.add('info-hotspot');

    // Create hotspot/tooltip header.
    var header = document.createElement('div');
    header.classList.add('info-hotspot-header');

    // Create image element.
    var iconWrapper = document.createElement('div');
    iconWrapper.classList.add('info-hotspot-icon-wrapper');
    var icon = document.createElement('img');
    icon.src = 'img/info.png';
    icon.classList.add('info-hotspot-icon');
    iconWrapper.appendChild(icon);

    // Create title element.
    var titleWrapper = document.createElement('div');
    titleWrapper.classList.add('info-hotspot-title-wrapper');
    var title = document.createElement('div');
    title.classList.add('info-hotspot-title');
    title.innerHTML = hotspot.title;
    titleWrapper.appendChild(title);

    // Create close element.
    var closeWrapper = document.createElement('div');
    closeWrapper.classList.add('info-hotspot-close-wrapper');
    var closeIcon = document.createElement('img');
    closeIcon.src = 'img/close.png';
    closeIcon.classList.add('info-hotspot-close-icon');
    closeWrapper.appendChild(closeIcon);

    // Construct header element.
    header.appendChild(iconWrapper);
    header.appendChild(titleWrapper);
    header.appendChild(closeWrapper);

    // Create text element.
    var text = document.createElement('div');
    text.classList.add('info-hotspot-text');
    text.innerHTML = hotspot.text;

    // Place header and text into wrapper element.
    wrapper.appendChild(header);
    wrapper.appendChild(text);

    // Create a modal for the hotspot content to appear on mobile mode.
    var modal = document.createElement('div');
    modal.innerHTML = wrapper.innerHTML;
    modal.classList.add('info-hotspot-modal');
    document.body.appendChild(modal);

    var toggle = function() {
      wrapper.classList.toggle('visible');
      modal.classList.toggle('visible');
    };

    // Show content when hotspot is clicked.
    wrapper.querySelector('.info-hotspot-header').addEventListener('click', toggle);

    // Hide content when close icon is clicked.
    modal.querySelector('.info-hotspot-close-wrapper').addEventListener('click', toggle);

    // Prevent touch and scroll events from reaching the parent element.
    // This prevents the view control logic from interfering with the hotspot.
    stopTouchAndScrollEventPropagation(wrapper);

    return wrapper;
  }

  // Prevent touch and scroll events from reaching the parent element.
  function stopTouchAndScrollEventPropagation(element, eventList) {
    var eventList = [ 'touchstart', 'touchmove', 'touchend', 'touchcancel',
                      'wheel', 'mousewheel' ];
    for (var i = 0; i < eventList.length; i++) {
      element.addEventListener(eventList[i], function(event) {
        event.stopPropagation();
      });
    }
  }

  function findSceneById(id) {
    for (var i = 0; i < scenes.length; i++) {
      if (scenes[i].data.id === id) {
        return scenes[i];
      }
    }
    return null;
  }

  function findSceneDataById(id) {
    for (var i = 0; i < data.scenes.length; i++) {
      if (data.scenes[i].id === id) {
        return data.scenes[i];
      }
    }
    return null;
  }


  // Wolfgarten Challenge: hotspots and shared score.
  var gameKey = 'wolfgarten-challenge-v1';
  var positionsKey = 'wolfgarten-challenge-positions-v1';
  var studentConfig = window.WOLF_STUDENT_CONFIG || {};
  var gameTasks = [];
  // Aufgaben und Positionen aus der veröffentlichten Konfiguration laden.
  var extraTasksKey = 'wolfgarten-challenge-extra-tasks-v1';
  var baseTaskCount = gameTasks.length;
  var extraTasks = Array.isArray(studentConfig.tasks) ? studentConfig.tasks : [];

  extraTasks.forEach(function(task) {
    if (task && (task.type === 'coin' || task.type === 'quiz' || task.type === 'info') && scenes.some(function(s) { return s.data.id === task.scene; })) {
      gameTasks.push(task);
    }
  });
  function saveExtraTasks() {
    try { localStorage.setItem(extraTasksKey, JSON.stringify(gameTasks.slice(baseTaskCount))); } catch(e) {}
  }
  // Eigene Fragen werden getrennt von Positionen gespeichert.
  var questionsKey = 'wolfgarten-challenge-questions-v1';
  var savedQuestions = studentConfig.questions || {};
  function applyQuestions() {
    Object.keys(savedQuestions).forEach(function(key) {
      var index = Number(key), saved = savedQuestions[key], task = gameTasks[index];
      if (!task || task.type !== 'quiz' || !saved || !Array.isArray(saved.answers)) return;
      task.question = String(saved.question || task.question);
      task.answers = saved.answers.map(String);
      task.correct = Math.max(0, Math.min(task.answers.length - 1, Number(saved.correct) || 0));
      task.points = Math.max(0, Math.min(100, Number(saved.points) || 0));
    });
  }
  applyQuestions();
  var savedPositions = studentConfig.positions || {};
  var done = {};
  // Bei jedem Öffnen der VR-Challenge ein neues Spiel beginnen.
done = {};
try { localStorage.removeItem(gameKey); } catch(e) {}
  var scoreEl = document.getElementById('wolfScore');
  var progressEl = document.getElementById('wolfProgress');
  var gameModal = document.getElementById('wolfModal');
  var gameContent = document.getElementById('wolfModalContent');
  var gameClose = document.getElementById('wolfClose');
  function gameSave() { try { localStorage.setItem(gameKey, JSON.stringify(done)); } catch(e) {} }
  function gameScore() {
    return gameTasks.reduce(function(sum, task, i) {
      if (done[i] !== true) return sum;

      if (task.type === 'coin') return sum + 5;

      if (task.type === 'quiz') {
        return sum + (task.points === undefined ? 10 : task.points);
      }

      return sum;
    }, 0);
  }

  function gameUpdate() {
    var pointTasks = gameTasks.filter(function(task) {
      return task.type === 'coin' || task.type === 'quiz';
    });

    var total = pointTasks.length;

    var count = gameTasks.filter(function(task, i) {
      return (task.type === 'coin' || task.type === 'quiz') &&
             done[i] === true;
    }).length;

    scoreEl.textContent = gameScore() + ' Punkte';

    progressEl.textContent =
      count + ' von ' + total + ' Aufgaben entdeckt';

    var bar = document.getElementById('wolfProgressBar');

    if (bar) {
      bar.style.width =
        (total ? count / total * 100 : 0) + '%';
    }
  }

    function gameOpen() { gameModal.classList.add('open'); gameModal.setAttribute('aria-hidden','false'); }
  function gameDismiss() { gameModal.classList.remove('open', 'wolf-info-open'); gameModal.setAttribute('aria-hidden','true'); }
  gameClose.addEventListener('click', gameDismiss);
  gameModal.addEventListener('click', function(e) { if(e.target === gameModal) gameDismiss(); });
  document.addEventListener('keydown', function(e) { if(e.key === 'Escape') gameDismiss(); });
  document.getElementById('wolfReset').addEventListener('click', function() {
    if (!confirm('Alle gesammelten Punkte und Lösungen zurücksetzen?')) return;
    done = {}; gameSave(); gameUpdate(); gameDismiss();
    document.querySelectorAll('.wolf-hotspot').forEach(function(el) { el.classList.remove('completed'); });
  });

  // Wolfgarten: fliegende Punkte-Animation
  function wolfFlyPoints(element, points) {
    var rect = element.getBoundingClientRect();
    var badge = document.createElement('div');

    badge.className = 'wolf-flying-points';
    badge.textContent = '+' + points;

    badge.style.left = (rect.left + rect.width / 2) + 'px';
    badge.style.top = (rect.top + rect.height / 2) + 'px';

    document.body.appendChild(badge);

    badge.addEventListener('animationend', function() {
      badge.remove();
    }, { once: true });

    setTimeout(function() {
      if (badge.parentNode) badge.remove();
    }, 1800);
  }

  function gameTaskClick(task, index, el) {
    gameContent.replaceChildren();
    if (task.type === 'info') {
      if (!done[index]) {
        done[index] = true;
        gameSave();
        gameUpdate();
        
        el.classList.add('completed');
      }
      var eyebrow = document.createElement('div');
      eyebrow.className = 'wolf-info-eyebrow';
      eyebrow.textContent = task.eyebrow || 'GYMNASIUM WOLFGARTEN';
      gameContent.appendChild(eyebrow);
      var infoTitle = document.createElement('h2');
      infoTitle.className = 'wolf-info-title';
      infoTitle.textContent = task.title || 'Unsere Schule';
      gameContent.appendChild(infoTitle);
      if (task.image) {
        var image = document.createElement('img');
        image.className = 'wolf-info-image';
        image.src = task.image;
        image.alt = task.title || 'Wolfgarten';
        image.loading = 'lazy';
        gameContent.appendChild(image);
      }
      var infoText = document.createElement('p');
      infoText.className = 'wolf-info-body';
      infoText.textContent = task.text || '';
      gameContent.appendChild(infoText);
      gameModal.classList.add('wolf-info-open');
      gameOpen();
      return;
    }
    gameModal.classList.remove('wolf-info-open');
    var title = document.createElement('h2');
    title.textContent = task.type === 'coin' ? '🐺 Wolfgarten-Coin gefunden!' : '❓ Wolfgarten-Quiz';
    gameContent.appendChild(title);
    var desc = document.createElement('p');
    if (task.type === 'coin') {
      if (done[index]) {
        desc.textContent = 'Diesen Wolfgarten-Coin hast du bereits eingesammelt.';
      } else {
        done[index] = true; gameSave(); gameUpdate(); wolfFlyPoints(el, 5); el.classList.add('completed');
        desc.textContent = '+5 Punkte! Suche weitere Wolfgarten-Coins und Quizfragen in der Schule.';
      }
      gameContent.appendChild(desc); gameOpen(); return;
    }
    desc.textContent = task.question;
    gameContent.appendChild(desc);
    var feedback = document.createElement('p');
    feedback.className = 'wolf-feedback';
    var answerButtons = [];
    var locked = !!done[index];
    function paint(selected, correct) {
      answerButtons.forEach(function(button, ai) {
        button.disabled = true;
        button.style.opacity = '1';
        button.style.color = '#24417B';
        button.style.backgroundColor = ai === task.correct ? '#CEE697' : (ai === selected && !correct ? '#EEE6D8' : '#F6F3EB');
        button.style.border = ai === task.correct ? '2px solid #83AB2E' : (ai === selected && !correct ? '2px solid #8793BC' : '1px solid #EEE6D8');
      });
    }
    task.answers.forEach(function(answer, ai) {
      var btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'wolf-answer'; btn.textContent = answer;
      btn.addEventListener('click', function() {
        if (locked || done[index]) return;
        locked = true;
        var correct = ai === task.correct;
        done[index] = correct ? true : 'wrong:' + ai;
        gameSave(); gameUpdate(); el.classList.add('completed');
        paint(ai, correct);
        feedback.textContent = correct ? 'Richtig! +' + (task.points === undefined ? 10 : task.points) + ' Punkte 🎉' : 'Leider falsch! 0 Punkte. Die richtige Antwort ist grün markiert.';
        feedback.className = 'wolf-feedback ' + (correct ? 'correct' : 'wrong');
      });
      answerButtons.push(btn);
      gameContent.appendChild(btn);
    });
    if (locked) {
      paint(typeof done[index] === 'string' && done[index].indexOf('wrong:') === 0 ? Number(done[index].split(':')[1]) : -1, done[index] === true);
      feedback.textContent = done[index] === true ? 'Bereits richtig beantwortet – die Punkte sind gespeichert.' : 'Bereits falsch beantwortet – kein weiterer Versuch möglich.';
      feedback.className = 'wolf-feedback ' + (done[index] === true ? 'correct' : 'wrong');
    }
    gameContent.appendChild(feedback);
    gameOpen();
  }
  var gameHotspots = [];
  var activeScene = scenes[0];
  var editMode = false;
  var selectedTask = -1;
  var editor = document.getElementById('wolfEditor');
  var editSelect = document.getElementById('wolfEditSelect');
  var editMessage = document.getElementById('wolfEditMessage');
  var editOverlay = document.getElementById('wolfEditOverlay');

  if (editor && editSelect && editMessage && editOverlay && document.getElementById('wolfEditToggle')) {
  // Quizfragen direkt im vorhandenen Bearbeitungsfenster ändern.
  var quizEditor = document.createElement('div');
  quizEditor.id = 'wolfQuizEditor';
  quizEditor.style.cssText = 'display:none;margin-top:16px;padding-top:12px;border-top:1px solid #EEE6D8;max-height:42vh;overflow-y:auto;';
  quizEditor.innerHTML = '<strong>❓ Quizfrage bearbeiten</strong>' +
    '<label for="wolfQuestionText">Fragetext</label><textarea id="wolfQuestionText" rows="3"></textarea>' +
    '<div id="wolfAnswerFields"></div>' +
    '<label for="wolfCorrectAnswer">Richtige Antwort</label><select id="wolfCorrectAnswer"></select>' +
    '<label for="wolfQuestionPoints">Punkte bei richtiger Antwort</label><input id="wolfQuestionPoints" type="number" min="0" max="100" step="1">' +
    '<button id="wolfSaveQuestion" type="button">Frage speichern</button>' +
    '<p id="wolfQuestionMessage" aria-live="polite"></p>';
  editor.appendChild(quizEditor);
  var questionInput = document.getElementById('wolfQuestionText');
  var answerFields = document.getElementById('wolfAnswerFields');
  var correctSelect = document.getElementById('wolfCorrectAnswer');
  var pointsInput = document.getElementById('wolfQuestionPoints');
  [questionInput, pointsInput].forEach(function(input) {
    input.style.cssText = 'box-sizing:border-box;width:100%;padding:8px;margin:5px 0 12px;color:#24417B;background:#FFFFFF;border-radius:6px;border:1px solid #8793BC;font:inherit;';
  });
  function refreshQuizEditor() {
    var task = gameTasks[selectedTask];
    quizEditor.style.display = task && task.type === 'quiz' ? 'block' : 'none';
    refreshInfoEditor();
    if (!task || task.type !== 'quiz') return;
    questionInput.value = task.question;
    answerFields.replaceChildren();
    correctSelect.replaceChildren();
    task.answers.forEach(function(answer, i) {
      var label = document.createElement('label');
      label.textContent = 'Antwort ' + (i + 1);
      var input = document.createElement('input');
      input.className = 'wolf-answer-edit'; input.value = answer;
      input.style.cssText = 'box-sizing:border-box;width:100%;padding:8px;margin:5px 0 12px;color:#24417B;background:#FFFFFF;border-radius:6px;border:1px solid #8793BC;font:inherit;';
      label.appendChild(input); answerFields.appendChild(label);
      var option = document.createElement('option');
      option.value = String(i); option.textContent = 'Antwort ' + (i + 1);
      correctSelect.appendChild(option);
    });
    correctSelect.value = String(task.correct);
    pointsInput.value = String(task.points === undefined ? 10 : task.points);
    document.getElementById('wolfQuestionMessage').textContent = '';
  }
  document.getElementById('wolfSaveQuestion').addEventListener('click', function() {
    var task = gameTasks[selectedTask];
    if (!task || task.type !== 'quiz') return;
    var answers = Array.prototype.map.call(answerFields.querySelectorAll('input'), function(input) { return input.value.trim(); });
    var question = questionInput.value.trim();
    var msg = document.getElementById('wolfQuestionMessage');
    if (!question || answers.some(function(a) { return !a; })) {
      msg.textContent = 'Bitte die Frage und alle Antworten ausfüllen.'; return;
    }
    task.question = question; task.answers = answers;
    task.correct = Number(correctSelect.value);
    task.points = Math.max(0, Math.min(100, Math.round(Number(pointsInput.value) || 0)));
    savedQuestions[selectedTask] = {question:task.question, answers:answers, correct:task.correct, points:task.points};
    try { localStorage.setItem(questionsKey, JSON.stringify(savedQuestions)); } catch(e) {}
    if (selectedTask >= baseTaskCount) saveExtraTasks();
    gameUpdate();
    msg.textContent = '✓ Frage gespeichert. Bitte anschließend die Konfiguration exportieren.';
  });


  // Wolfgarten-Infotafeln: Inhalte im Editor pflegen.
  var infoEditor = document.createElement('div');
  infoEditor.id = 'wolfInfoEditor';
  infoEditor.style.cssText = 'display:none;margin-top:14px;padding-top:12px;border-top:1px solid #EEE6D8;max-height:42vh;overflow-y:auto;';
  infoEditor.innerHTML = '<strong>ⓘ Infotafel bearbeiten</strong>' +
    '<label for="wolfInfoEyebrow">Kleine grüne Überschrift</label><input id="wolfInfoEyebrow" type="text">' +
    '<label for="wolfInfoTitle">Titel</label><input id="wolfInfoTitle" type="text">' +
    '<label for="wolfInfoText">Beschreibung</label><textarea id="wolfInfoText" rows="5"></textarea>' +
    '<label for="wolfInfoImage">Bildpfad (optional, z. B. img/science.jpg)</label><input id="wolfInfoImage" type="text" placeholder="img/science.jpg">' +
    '<button id="wolfSaveInfo" type="button">Infotafel speichern</button>' +
    '<p id="wolfInfoMessage" aria-live="polite"></p>';
  editor.appendChild(infoEditor);
  ['wolfInfoEyebrow','wolfInfoTitle','wolfInfoText','wolfInfoImage'].forEach(function(id) {
    document.getElementById(id).style.cssText = 'box-sizing:border-box;width:100%;padding:8px;margin:5px 0 12px;color:#24417B;background:#fff;border-radius:6px;border:1px solid #8793BC;font:inherit;';
  });
  function refreshInfoEditor() {
    var task = gameTasks[selectedTask];
    infoEditor.style.display = task && task.type === 'info' ? 'block' : 'none';
    if (!task || task.type !== 'info') return;
    document.getElementById('wolfInfoEyebrow').value = task.eyebrow || '';
    document.getElementById('wolfInfoTitle').value = task.title || '';
    document.getElementById('wolfInfoText').value = task.text || '';
    document.getElementById('wolfInfoImage').value = task.image || '';
    document.getElementById('wolfInfoMessage').textContent = '';
  }
  document.getElementById('wolfSaveInfo').addEventListener('click', function() {
    var task = gameTasks[selectedTask];
    if (!task || task.type !== 'info') return;
    task.eyebrow = document.getElementById('wolfInfoEyebrow').value.trim();
    task.title = document.getElementById('wolfInfoTitle').value.trim();
    task.text = document.getElementById('wolfInfoText').value.trim();
    task.image = document.getElementById('wolfInfoImage').value.trim();
    if (!task.title) {
      document.getElementById('wolfInfoMessage').textContent = 'Bitte einen Titel eingeben.';
      return;
    }
    saveExtraTasks();
    document.getElementById('wolfInfoMessage').textContent = '✓ Infotafel gespeichert. Anschließend Konfiguration exportieren.';
  });




  // Neue Aufgaben direkt im Editor erstellen und entfernen.
  var createArea = document.createElement('div');
  createArea.style.cssText = 'margin:12px 0;padding:10px 0;border-top:1px solid #EEE6D8;display:flex;flex-wrap:wrap;gap:6px;';
  function editorButton(label) {
    var button = document.createElement('button');
    button.type = 'button'; button.textContent = label;
    button.style.cssText = 'cursor:pointer;padding:8px 10px;border-radius:6px;';
    createArea.appendChild(button);
    return button;
  }
  var addCoinButton = editorButton('＋ Neue Münze');
  var addQuizButton = editorButton('＋ Neue Quizfrage');
  var addInfoButton = editorButton('＋ Neue Infotafel');
  var removeButton = editorButton('Aufgabe löschen');
  // Die neuen Knöpfe oberhalb des Frageneditors anzeigen.
  editor.insertBefore(createArea, quizEditor);
  function addTask(type) {
    var task = {
      scene: activeScene.data.id,
      type: type,
      offset: 0,
      pitch: 0,
      points: type === 'quiz' ? 10 : (type === 'coin' ? 5 : 0)
    };
    if (type === 'quiz') {
      task.question = 'Neue Frage – bitte bearbeiten';
      task.answers = ['Antwort 1', 'Antwort 2', 'Antwort 3'];
      task.correct = 0;
    }
    if (type === 'info') {
      task.eyebrow = 'GYMNASIUM WOLFGARTEN';
      task.title = 'Unsere Schule';
      task.text = 'Hier kannst du deine Infotafel beschreiben.';
      task.image = '';
    }
    var index = gameTasks.length;
    gameTasks.push(task);
    createGameHotspot(task, index);
    saveExtraTasks();
    refreshEditSelect(index);
    gameUpdate();
    editMessage.textContent = '✓ Neue ' + (type === 'coin' ? 'Münze' : (type === 'quiz' ? 'Frage' : 'Infotafel')) + ' erstellt. Mit Option + Klick im Panorama platzieren.';
    if (type === 'quiz') document.getElementById('wolfQuestionMessage').textContent = 'Frage und Antworten bearbeiten, danach „Frage speichern“ klicken.';
  }
  addCoinButton.addEventListener('click', function() { addTask('coin'); });
  addQuizButton.addEventListener('click', function() { addTask('quiz'); });
  addInfoButton.addEventListener('click', function() { addTask('info'); });
  removeButton.addEventListener('click', function() {
    if (selectedTask < 0 || !gameTasks[selectedTask]) return;
    if (selectedTask < baseTaskCount) {
      editMessage.textContent = 'Die ursprünglichen Aufgaben können nicht gelöscht werden, damit bestehende Spielstände erhalten bleiben.';
      return;
    }
    if (!confirm('Diese zusätzliche Aufgabe wirklich löschen?')) return;
    var index = selectedTask;
    // Eine gelöschte Zusatzaufgabe wird aus dem Spiel entfernt. Spätere Indizes werden angepasst.
    if (gameHotspots[index]) gameHotspots[index].hotspot.destroy();
    gameTasks.splice(index, 1);
    gameHotspots.splice(index, 1);
    function shiftKeys(obj) {
      var next = {};
      Object.keys(obj).forEach(function(key) {
        var n = Number(key);
        if (!Number.isInteger(n)) { next[key] = obj[key]; return; }
        if (n < index) next[n] = obj[key];
        else if (n > index) next[n-1] = obj[key];
      });
      return next;
    }
    savedPositions = shiftKeys(savedPositions);
    savedQuestions = shiftKeys(savedQuestions);
    done = shiftKeys(done);
    // Hotspots der späteren Zusatzaufgaben neu erzeugen, damit Klick-Indizes stimmen.
    for (var i = index; i < gameHotspots.length; i++) {
      if (gameHotspots[i]) gameHotspots[i].hotspot.destroy();
      createGameHotspot(gameTasks[i], i);
    }
    localStorage.setItem(positionsKey, JSON.stringify(savedPositions));
    localStorage.setItem(questionsKey, JSON.stringify(savedQuestions));
    gameSave(); saveExtraTasks();
    refreshEditSelect(); gameUpdate();
    editMessage.textContent = '✓ Zusatzaufgabe gelöscht.';
  });
  function refreshEditSelect(preferredIndex) {
    editSelect.replaceChildren();
    gameTasks.forEach(function(task, i) {
      if (task.scene !== activeScene.data.id) return;
      var option = document.createElement('option');
      option.value = String(i);
      option.textContent = (task.type === 'coin' ? '🪙 Münze ' : (task.type === 'quiz' ? '❓ Frage ' : 'ⓘ Infotafel ')) + (i+1);
      editSelect.appendChild(option);
    });
    if (preferredIndex !== undefined && editSelect.querySelector('option[value="' + preferredIndex + '"]')) editSelect.value = String(preferredIndex);
    selectedTask = editSelect.options.length ? Number(editSelect.value) : -1;
    editMessage.textContent = selectedTask < 0 ? 'In diesem Raum ist noch keine Aufgabe.' : 'Mit der Maus umsehen. Zum Platzieren ALT (Option) gedrückt halten und auf die gewünschte Stelle klicken.';
    refreshQuizEditor();
  }
  editSelect.addEventListener('change', function() { selectedTask = Number(editSelect.value); refreshQuizEditor(); });
  document.getElementById('wolfEditToggle').addEventListener('click', function() {
    editMode = !editMode;
    editor.hidden = !editMode;
    editOverlay.hidden = true; // Keine blockierende Ebene über dem Panorama
    document.body.classList.toggle('wolf-editing', editMode);
    if (editMode) { stopAutorotate(); refreshEditSelect(); }
  });
  // Positionieren mit Alt/Option + Klick, ohne die Mausnavigation zu blockieren.
  panoElement.addEventListener('click', function(event) {
    if (!editMode || !event.altKey || selectedTask < 0 || !gameHotspots[selectedTask]) return;
    event.preventDefault();
    event.stopPropagation();
    var rect = panoElement.getBoundingClientRect();
    var coords = activeScene.view.screenToCoordinates({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    });
    if (!coords || !isFinite(coords.yaw) || !isFinite(coords.pitch)) {
      editMessage.textContent = 'Position nicht ermittelbar. Bitte erneut versuchen.';
      return;
    }
    gameHotspots[selectedTask].hotspot.setPosition({yaw:coords.yaw, pitch:coords.pitch});
    savedPositions[selectedTask] = {yaw:coords.yaw, pitch:coords.pitch};
    try { localStorage.setItem(positionsKey, JSON.stringify(savedPositions)); } catch(e) {}
    editMessage.textContent = '✓ Position gespeichert. Weitere Platzierung: Alt/Option + Klick.';
  }, true);
  document.getElementById('wolfExportPositions').addEventListener('click', function() {
    var file = new Blob([JSON.stringify({version:2, positions:savedPositions, questions:savedQuestions, extraTasks:gameTasks.slice(baseTaskCount)}, null, 2)], {type:'application/json'});
    var url = URL.createObjectURL(file);
    var a = document.createElement('a'); a.href = url; a.download = 'wolfgarten-konfiguration.json'; a.click();
    setTimeout(function() { URL.revokeObjectURL(url); }, 2000);
  });
  document.getElementById('wolfImportPositions').addEventListener('change', function(event) {
    var file = event.target.files[0]; if (!file) return;
    file.text().then(function(text) {
      var config = JSON.parse(text);
      var positions = config.positions || config; // alte Positionsdateien bleiben kompatibel
      if (Array.isArray(config.extraTasks)) {
        // Bestehende Zusatz-Hotspots entfernen, dann importierte Aufgaben laden.
        for (var i = baseTaskCount; i < gameHotspots.length; i++) {
          if (gameHotspots[i]) gameHotspots[i].hotspot.destroy();
        }
        gameTasks.length = baseTaskCount;
        gameHotspots.length = baseTaskCount;
        config.extraTasks.forEach(function(task) {
          if (!task || (task.type !== 'coin' && task.type !== 'quiz' && task.type !== 'info')) return;
          if (!scenes.some(function(s) { return s.data.id === task.scene; })) return;
          var index = gameTasks.length;
          gameTasks.push(task);
          createGameHotspot(task, index);
        });
        saveExtraTasks();
      }
      if (config.questions && typeof config.questions === 'object') {
        savedQuestions = config.questions;
        applyQuestions();
        localStorage.setItem(questionsKey, JSON.stringify(savedQuestions));
        refreshQuizEditor();
      }
      Object.keys(positions).forEach(function(key) {
        var index = Number(key), pos = positions[key];
        if (gameHotspots[index] && pos && isFinite(pos.yaw) && isFinite(pos.pitch)) {
          gameHotspots[index].hotspot.setPosition({yaw:pos.yaw,pitch:pos.pitch});
          savedPositions[index] = {yaw:pos.yaw,pitch:pos.pitch};
        }
      });
      localStorage.setItem(positionsKey, JSON.stringify(savedPositions));
      refreshEditSelect(); gameUpdate();
      editMessage.textContent = '✓ Positionen, Fragen und Zusatzaufgaben importiert.';
    }).catch(function() { editMessage.textContent = 'Datei konnte nicht importiert werden.'; });
    event.target.value = '';
  });
  }

  function createGameHotspot(task, index) {
    var target = scenes.find(function(s) { return s.data.id === task.scene; });
    if (!target) return;
    var el = document.createElement('button'); el.type = 'button';
    el.className = 'wolf-hotspot ' + (task.type === 'coin' ? 'wolf-coin' : (task.type === 'quiz' ? 'wolf-quiz' : 'wolf-info')) + (done[index] ? ' completed' : '');
    if (task.type === 'coin') {
      el.textContent = '';
      el.style.setProperty('background-image', 'url("img/wolfgarten-coin.png")', 'important');
      el.style.setProperty('background-size', 'contain', 'important');
      el.style.setProperty('background-position', 'center', 'important');
      el.style.setProperty('background-repeat', 'no-repeat', 'important');
      el.style.setProperty('background-color', 'transparent', 'important');
      el.style.setProperty('border', '0', 'important');
      el.style.setProperty('border-radius', '50%', 'important');
      el.style.setProperty('padding', '0', 'important');
      el.style.setProperty('width', '33px', 'important');
      el.style.setProperty('height', '33px', 'important');
    } else {
      el.textContent = task.type === 'quiz' ? '❓' : 'ⓘ';
    }
    el.title = task.type === 'coin' ? 'Coin einsammeln' : (task.type === 'quiz' ? 'Quizfrage öffnen' : 'Infotafel öffnen');
    el.setAttribute('aria-label', el.title);
    el.addEventListener('click', function(e) {
      e.stopPropagation();
      if (editMode) { selectedTask = index; editSelect.value = String(index); refreshQuizEditor(); editMessage.textContent = 'Alt/Option gedrückt halten und auf die gewünschte Stelle klicken.'; return; }
      gameTaskClick(task,index,el);
    });
    stopTouchAndScrollEventPropagation(el);
    var fallback = {yaw:target.data.initialViewParameters.yaw + task.offset, pitch:task.pitch};
    var position = savedPositions[index] || fallback;
    var hotspot = target.scene.hotspotContainer().createHotspot(el, position);
    gameHotspots[index] = {hotspot:hotspot, target:target, fallback:fallback, element:el};
  }

  gameTasks.forEach(createGameHotspot);

  // Follow Marzipano scene changes (also for link hotspots).
  var originalSwitchScene = switchScene;
  switchScene = function(scene) {
    activeScene = scene;
    originalSwitchScene(scene);
    if (editMode && typeof refreshEditSelect === 'function') refreshEditSelect();
  };
  gameUpdate();


  window.WOLF_VR_BRIDGE = {
    getScenes: function() {
      return scenes.map(function(s) { return s.data; });
    },
    getActiveScene: function() {
      return activeScene ? activeScene.data : null;
    },
    switchScene: function(id) {
      var target = findSceneById(id);
      if (target) switchScene(target);
    },
    getHotspots: function() {
      return gameHotspots;
    },
    getTasks: function() {
      return gameTasks;
    },
    getScore: function() {
      return gameScore();
    },
    getProgress: function() {
      return Object.assign({}, done);
    }
  };

  // Display the initial scene.
  switchScene(findSceneById('6-aueneingang') || scenes[0]);

})();
