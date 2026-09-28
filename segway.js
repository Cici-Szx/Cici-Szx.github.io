(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const ratio = $('#energy-ratio');
  const gap = $('#beat-gap');
  function updatePulseInputs() {
    $('#energy-value').textContent = `${Number(ratio.value).toFixed(1)}×`;
    $('#gap-value').textContent = `${gap.value} ms`;
    $('#energy-fill').style.width = `${Number(ratio.value) / 4 * 100}%`;
    $('#pulse-result').textContent = 'Inputs changed. Test the pulse to see the result.';
  }
  [ratio, gap].forEach(input => input.addEventListener('input', updatePulseInputs));
  $('#test-pulse').addEventListener('click', () => {
    const energyPass = Number(ratio.value) > 2.5;
    const timePass = Number(gap.value) > 150;
    $('#pulse-result').textContent = energyPass && timePass
      ? 'Beat accepted → advance one move. Both conditions are met.'
      : !energyPass && !timePass
        ? 'No beat → energy must exceed 2.5× and the interval must exceed 150 ms.'
        : !energyPass ? 'No beat → energy must exceed 2.5× the rolling average.'
        : 'No beat → wait more than 150 ms after the previous beat.';
  });
  const loopDescriptions = [
    'The IMU supplies accelerometer tilt and gyro rate.',
    'A complementary filter combines the two sensor inputs into a pitch estimate.',
    'The controller compares estimated pitch with the target. Integral and output limits constrain the command.',
    'Both motors correct tilt. The next IMU reading feeds back into the loop, including between beats.'
  ];
  document.querySelectorAll('[data-loop]').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('[data-loop]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    $('#loop-detail').textContent = loopDescriptions[Number(button.dataset.loop)];
  }));
  const components = [
    ['CONTROL','Controller','Runs the MicroPython program, coordinating audio events, the stored dance sequence and balance control.'],
    ['VISIBLE FEEDBACK','NeoPixel','A vertical light strip flashes on each detected beat, making audio events visible.'],
    ['ORIENTATION INPUT','IMU','Accelerometer tilt and gyro rate feed a complementary filter to estimate pitch.'],
    ['AUDIO INPUT','Microphone','Captures live audio for energy-based beat detection at an 8 kHz sampling rate.'],
    ['SYSTEM STATE','OLED','Displays the system state so the robot’s activity can be read at a glance.'],
    ['ACTUATION','Motor drive','Applies combined balance and turn commands to the two motors.']
  ];
  document.querySelectorAll('[data-component]').forEach(button => button.addEventListener('click', () => {
    const index = Number(button.dataset.component);
    document.querySelectorAll('[data-component]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    $('#hardware-number').textContent = `0${index + 1} / ${components[index][0]}`;
    $('#hardware-name').textContent = components[index][1];
    $('#hardware-description').textContent = components[index][2];
  }));

  const moves = [...document.querySelectorAll('.move-cell select')];
  const stage = $('.dance-stage');
  const board = $('#dancing-board');
  const play = $('#play-dance');
  const tap = $('#tap-beat');
  const tilt = $('#tilt-input');
  const names = {F:'Forward', B:'Backward', L:'Turn left', R:'Turn right'};
  let step = -1;
  let timer = null;
  let flashTimer = null;
  let lastBeat = -Infinity;
  let blocked = false;
  const isPlaying = () => timer !== null;
  function stopPlayback() {
    clearInterval(timer);
    timer = null;
    play.textContent = 'Play demo';
    play.setAttribute('aria-pressed', 'false');
    $('#demo-mode').textContent = blocked ? 'Tilt cutoff' : step < 0 ? 'Ready' : 'Paused';
    stage.classList.remove('is-beat');
  }
  function renderCommand() {
    moves.forEach((move, index) => {
      move.parentElement.classList.toggle('is-current', index === step);
      if (index === step) move.setAttribute('aria-current', 'step');
      else move.removeAttribute('aria-current');
    });
    const move = step >= 0 ? moves[step].value : null;
    board.dataset.move = blocked ? '' : move || '';
    $('#step-label').textContent = step < 0 ? 'READY / 8 STEPS' : `STEP ${String(step + 1).padStart(2, '0')} / 08`;
    $('#move-name').textContent = blocked ? 'Motors stopped.' : move ? names[move] : 'Your rhythm. Its next move.';
    const turning = move === 'L' || move === 'R';
    $('#pitch-command').textContent = !blocked && (move === 'F' || move === 'B') ? `${names[move]} · 1.5°` : '0°';
    $('#turn-command').textContent = !blocked && turning ? `${move === 'L' ? 'Left' : 'Right'} · ±18` : 'No bias';
    $('#motor-a').textContent = blocked ? '0 · stopped' : turning ? 'balance + turn' : 'balance';
    $('#motor-b').textContent = blocked ? '0 · stopped' : turning ? 'balance − turn' : 'balance';
    $('#balance-state').textContent = blocked ? 'Motors off · PID integral reset' : 'Balance loop active';
    board.querySelector('.board-oled').textContent = blocked ? 'Stop' : move ? move : 'Ready';
  }
  function advanceBeat(announce = true) {
    if (blocked) return;
    const now = performance.now();
    if (now - lastBeat <= 150) {
      if (announce) $('#dance-announcement').textContent = 'Beat ignored: wait more than 150 milliseconds between beats.';
      return;
    }
    lastBeat = now;
    step = (step + 1) % moves.length;
    renderCommand();
    stage.classList.add('is-beat');
    clearTimeout(flashTimer);
    flashTimer = setTimeout(() => stage.classList.remove('is-beat'), 220);
    $('#demo-mode').textContent = isPlaying() ? 'Playing · 96 BPM' : 'Beat received';
    if (announce) $('#dance-announcement').textContent = `Step ${step + 1} of 8: ${names[moves[step].value]}. Balance loop active.`;
  }
  tap.addEventListener('click', () => { stopPlayback(); advanceBeat(); });
  play.addEventListener('click', () => {
    if (isPlaying()) { stopPlayback(); return; }
    if (blocked) return;
    timer = setInterval(() => advanceBeat(false), 625);
    play.textContent = 'Pause demo';
    play.setAttribute('aria-pressed', 'true');
    advanceBeat(false);
    $('#demo-mode').textContent = 'Playing · 96 BPM';
    $('#dance-announcement').textContent = 'Demo playing at 96 beats per minute. Use Pause demo to stop.';
  });
  moves.forEach(move => move.addEventListener('change', () => {
    stopPlayback();
    // Editing changes the stored sequence; the new program starts on the next beat.
    step = -1;
    lastBeat = -Infinity;
    renderCommand();
    $('#demo-mode').textContent = blocked ? 'Tilt cutoff' : 'Sequence updated';
    $('#dance-announcement').textContent = 'Sequence updated. Tap a beat to start at step one.';
  }));
  function updateTilt() {
    const value = Number(tilt.value);
    blocked = Math.abs(value) > 60;
    $('#tilt-value').textContent = `${value}°`;
    stage.classList.toggle('cutoff', blocked);
    if (blocked) stopPlayback();
    tap.disabled = blocked;
    play.disabled = blocked;
    $('#cutoff-status').textContent = blocked
      ? 'Beyond ±60° → both motors stop and the PID integral resets.'
      : 'Within ±60° · balance commands remain enabled.';
    if (!blocked && !isPlaying()) $('#demo-mode').textContent = step < 0 ? 'Ready' : 'Paused';
    renderCommand();
  }
  tilt.addEventListener('input', updateTilt);
  $('#reset-dance').addEventListener('click', () => {
    stopPlayback();
    clearTimeout(flashTimer);
    step = -1;
    lastBeat = -Infinity;
    moves.forEach((move, index) => move.value = 'FBFBLRLR'[index]);
    tilt.value = '0';
    updateTilt();
    $('#dance-announcement').textContent = 'Reset to the original eight-step sequence. Ready for a beat.';
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopPlayback(); });
  new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting && isPlaying()) stopPlayback();
  }, {threshold:0}).observe($('.dance-lab'));
  window.addEventListener('pagehide', stopPlayback);
  renderCommand();

  const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-revealed');
      revealObserver.unobserve(entry.target);
    }
  }), {threshold:0.08});
  if (!reducedMotion.matches) document.querySelectorAll('[data-reveal]').forEach(element => {
    if (element.getBoundingClientRect().top >= innerHeight) {
      element.classList.add('will-reveal');
      revealObserver.observe(element);
    }
  });
})();
