(function () {
  'use strict';

  let vrScene = null;
  let panorama = null;
  let hotspots = null;
  let ready = false;

  const button = document.createElement('button');

  button.id = 'wolfVRButton';
  button.textContent = '🥽 VR-Brille';

  Object.assign(button.style, {
    position: 'fixed',
    bottom: '20px',
    left: '20px',
    zIndex: '10000',
    background: '#24417B',
    color: '#F2E6CA',
    border: '2px solid #83AB2E',
    borderRadius: '24px',
    padding: '12px 20px',
    font: 'bold 15px Arial',
    cursor: 'pointer'
  });

  document.body.appendChild(button);

  function entity(tag, attributes, parent) {
    const el = document.createElement(tag);

    Object.entries(attributes).forEach(([key, value]) => {
      el.setAttribute(key, value);
    });

    parent.appendChild(el);
    return el;
  }

  function loadEngine() {
    return new Promise((resolve, reject) => {
      if (window.AFRAME) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'vr-test/aframe.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function position(yaw, pitch, radius) {
    return [
      radius * Math.sin(yaw) * Math.cos(pitch),
      -radius * Math.sin(pitch),
      -radius * Math.cos(yaw) * Math.cos(pitch)
    ].join(' ');
  }

  function showRoom(room) {
    if (!room) return;

    panorama.replaceChildren();
    hotspots.replaceChildren();

    const base = 'vr-test/panoramas/' + room.id + '/';

    const faces = [
      ['f', '0 0 -10', '0 0 0'],
      ['b', '0 0 10', '0 180 0'],
      ['l', '-10 0 0', '0 90 0'],
      ['r', '10 0 0', '0 -90 0'],
      ['u', '0 10 0', '90 0 0'],
      ['d', '0 -10 0', '-90 0 0']
    ];

    faces.forEach(([face, pos, rotation]) => {
      entity('a-plane', {
        position: pos,
        rotation: rotation,
        width: 20,
        height: 20,
        material: 'shader: flat; src: url(' +
          base + face + '.jpg)'
      }, panorama);
    });

    (room.linkHotspots || []).forEach(link => {
      const arrow = entity('a-image', {
        src: 'img/link.png',
        position: position(link.yaw, link.pitch, 4),
        width: 0.38,
        height: 0.38,
        rotation: [
          -link.pitch * 180 / Math.PI,
          -link.yaw * 180 / Math.PI,
          -(link.rotation || 0) * 180 / Math.PI
        ].join(' '),
        class: 'clickable',
        material: 'shader: flat; transparent: true'
      }, hotspots);

      arrow.addEventListener('click', () => {
        WOLF_VR_BRIDGE.switchScene(link.target);
        showRoom(WOLF_VR_BRIDGE.getActiveScene());
      });
    });
  }

  async function prepareVR() {
    await loadEngine();

    vrScene = entity('a-scene', {
      embedded: '',
      'vr-mode-ui': 'enabled: false',
      renderer: 'antialias: true',
      'xr-mode-ui': 'enabled: false',
      'webxr': 'referenceSpaceType: local',
      background: 'color: #000000'
    }, document.body);

    Object.assign(vrScene.style, {
      position: 'fixed',
      inset: '0',
      width: '100%',
      height: '100%',
      zIndex: '9999',
      visibility: 'hidden'
    });

    panorama = entity('a-entity', {}, vrScene);
    hotspots = entity('a-entity', {}, vrScene);

    const rig = entity('a-entity', {}, vrScene);

    entity('a-camera', {
      position: '0 0 0',
      'wasd-controls-enabled': 'false'
    }, rig);

    ['left', 'right'].forEach(hand => {
      entity('a-entity', {
        'laser-controls': 'hand: ' + hand,
        raycaster: 'objects: .clickable'
      }, rig);
    });

    vrScene.addEventListener('enter-vr', () => {
      vrScene.style.visibility = 'visible';
      button.style.display = 'none';
    });

    vrScene.addEventListener('exit-vr', () => {
      vrScene.style.visibility = 'hidden';
      button.style.display = '';
      button.textContent = '🥽 VR-Brille';
    });

    showRoom(WOLF_VR_BRIDGE.getActiveScene());

    if (!vrScene.hasLoaded) {
      await new Promise(resolve => {
        vrScene.addEventListener(
          'loaded', resolve, { once: true }
        );
      });
    }

    ready = true;
  }

  button.addEventListener('click', async () => {
    try {
      if (!navigator.xr) {
        alert('WebXR ist nicht verfügbar.');
        return;
      }

      if (!window.WOLF_VR_BRIDGE) {
        alert('Der Rundgang wird noch geladen.');
        return;
      }

      if (!ready) {
        button.disabled = true;
        button.textContent = 'VR wird vorbereitet …';

        await prepareVR();

        button.disabled = false;
        button.textContent = '🥽 VR starten';
        return;
      }

      showRoom(WOLF_VR_BRIDGE.getActiveScene());
      await vrScene.enterVR();

    } catch (error) {
      button.disabled = false;
      button.textContent = '🥽 VR-Brille';
      alert('VR-Fehler: ' + error.message);
    }
  });

})();
