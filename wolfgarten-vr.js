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


  let vrDialog = null;
  let vrHud = null;
  let vrCamera = null;
  let dialogVersion = 0;

  async function capture(element) {
    return html2canvas(element, {
      backgroundColor: null,
      scale: 2,
      logging: false,
      useCORS: true
    });
  }

  function texturePlane(canvas, parent, width, pos) {
    const plane = entity('a-plane', {
      width: width,
      height: width * canvas.height / canvas.width,
      position: pos,
      material: 'shader: flat; transparent: true'
    }, parent);

    const texture = new AFRAME.THREE.CanvasTexture(canvas);

    function apply() {
      const mesh = plane.getObject3D('mesh');
      if (mesh) {
        mesh.material.map = texture;
        mesh.material.transparent = true;
        mesh.material.needsUpdate = true;
      }
    }

    plane.addEventListener('object3dset', apply);
    plane.addEventListener('loaded', apply);
    apply();

    return plane;
  }

  async function updateHud() {
    if (!vrHud) return;

    const canvas = document.createElement('canvas');
    canvas.width = 1000;
    canvas.height = 120;

    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#24417B';
    ctx.fillRect(0, 0, 1000, 120);

    ctx.font = 'bold 36px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';

    ctx.fillText(
      document.getElementById('wolfScore').textContent,
      500, 46
    );

    ctx.font = 'bold 29px Arial';
    ctx.fillStyle = '#CEE697';

    ctx.fillText(
      document.getElementById('wolfProgress').textContent,
      500, 94
    );

    vrHud.replaceChildren();

    texturePlane(canvas, vrHud, 1.15, '0 0.65 -2');
  }

  function closeVRDialog() {
    dialogVersion++;
    vrDialog.replaceChildren();
    hotspots.setAttribute('visible', true);
  }

  async function showOriginalDialog() {
    const version = ++dialogVersion;
    const modal = document.getElementById('wolfModal');

    if (!modal.classList.contains('open')) {
      closeVRDialog();
      return;
    }

    const panel = modal.querySelector('.wolf-dialog');

    if (!panel) return;

    const rect = panel.getBoundingClientRect();

    const controls = Array.from(
      panel.querySelectorAll('button')
    ).map(button => ({
      button,
      rect: button.getBoundingClientRect()
    }));

    const canvas = await capture(panel);

    if (version !== dialogVersion) return;

    vrDialog.replaceChildren();
    hotspots.setAttribute('visible', false);

    const width = Math.min(
      1.8,
      1.35 * canvas.width / canvas.height
    );

    const height = width * canvas.height / canvas.width;

    const plane = texturePlane(
      canvas, vrDialog, width, '0 0 -2'
    );

    plane.classList.add('clickable');

    plane.addEventListener('click', async event => {
      const uv = event.detail.intersection?.uv;

      if (!uv) return;

      const x = rect.left + uv.x * rect.width;
      const y = rect.top + (1 - uv.y) * rect.height;

      const target = controls.find(({rect: r}) =>
        x >= r.left && x <= r.right &&
        y >= r.top && y <= r.bottom
      );

      if (!target || target.button.disabled) return;

      target.button.click();

      updateHud();

      if (modal.classList.contains('open')) {
        await showOriginalDialog();
      } else {
        closeVRDialog();
      }
    });
  }

  function addChallengeTasks(room) {
    const tasks = WOLF_VR_BRIDGE.getRoomTasks(room.id);

    tasks.forEach(task => {
      const size = 0.30;

      const marker = entity('a-plane', {
        position: position(task.yaw, task.pitch, 4),
        rotation: [
          -task.pitch * 180 / Math.PI,
          -task.yaw * 180 / Math.PI,
          0
        ].join(' '),
        width: size,
        height: size,
        material: 'shader: flat; transparent: true',
        class: 'clickable'
      }, hotspots);

      if (task.type === 'coin') {
        marker.setAttribute(
          'material',
          'shader: flat; transparent: true; src: url(img/wolfgarten-coin.png)'
        );
      } else {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;

        const ctx = canvas.getContext('2d');
        const css = getComputedStyle(task.element);

        ctx.fillStyle = css.backgroundColor;
        ctx.beginPath();
        ctx.arc(128, 128, 116, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = css.borderColor;
        ctx.lineWidth = 12;
        ctx.stroke();

        ctx.fillStyle = css.color;
        ctx.font = 'bold 150px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(task.element.textContent, 128, 128);

        const texture = new AFRAME.THREE.CanvasTexture(canvas);

        function apply() {
          const mesh = marker.getObject3D('mesh');
          if (mesh) {
            mesh.material.map = texture;
            mesh.material.needsUpdate = true;
          }
        }

        marker.addEventListener('loaded', apply);
        apply();
      }

      if (task.completed) {
        marker.setAttribute('material', 'opacity', 0.45);
      }

      marker.addEventListener('click', async () => {
        if (document.getElementById('wolfModal')
            .classList.contains('open')) return;

        WOLF_VR_BRIDGE.clickTask(task.index);

        const current = WOLF_VR_BRIDGE.getRoomTasks(room.id)
          .find(t => t.index === task.index);

        if (current && current.completed) {
          marker.setAttribute('material', 'opacity', 0.45);
        }

        updateHud();
        await showOriginalDialog();
      });
    });
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

    addChallengeTasks(room);
    updateHud();
  }

  async function prepareVR() {
    await loadEngine();

    if (!window.html2canvas) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'vendor/html2canvas.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

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

    vrCamera = entity('a-camera', {
      position: '0 0 0',
      'wasd-controls-enabled': 'false'
    }, rig);

    vrHud = entity('a-entity', {}, vrCamera);
    vrDialog = entity('a-entity', {}, vrCamera);

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
