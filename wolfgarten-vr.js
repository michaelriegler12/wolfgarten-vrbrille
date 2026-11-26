(function () {
  'use strict';

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

  button.addEventListener('click', async function () {
    if (!navigator.xr) {
      alert('WebXR ist in diesem Browser nicht verfügbar.');
      return;
    }

    try {
      const supported =
        await navigator.xr.isSessionSupported('immersive-vr');

      alert(supported
        ? 'Immersiver VR-Modus wird unterstützt.'
        : 'Keine kompatible VR-Brille erkannt.');
    } catch (error) {
      alert('WebXR: ' + error.message);
    }
  });

  document.body.appendChild(button);
})();
