(() => {
'use strict';
const $ = id => document.getElementById(id);
const tasks = [...document.querySelectorAll('[data-task]')];
let wishAdded = false;
function celebrate() {
 const device = document.querySelector('.cup-demo-device');
 device.classList.remove('pulse');
 requestAnimationFrame(() => device.classList.add('pulse'));
}
function updateTasks(announce = true) {
 const visible = tasks.filter(t => t.dataset.task !== 'wish' || wishAdded);
 const done = visible.filter(t => t.checked).length;
 const left = visible.length - done;
 $('task-count').textContent = left ? `${left} little thing${left === 1 ? '' : 's'} left` : 'A little more done, together.';
 $('task-progress').style.width = `${done / visible.length * 100}%`;
 $('task-feedback').textContent = done ? `${done} of ${visible.length} complete. Every little thing counts.` : 'A clear owner. A small next step.';
 if (announce) $('partner-message').textContent = left ? `${done} done. ${left} little thing${left === 1 ? '' : 's'} still to share.` : 'All caught up. Time for a little more us.';
}
tasks.forEach(t => t.addEventListener('change', () => { updateTasks(); if(t.checked) celebrate(); }));
const money = value => '£' + value.toFixed(2);
function split(announce = true) {
 const ratio = Number($('split-ratio').value), a = 84 * ratio / 100, b = 84 - a;
 $('split-percent').textContent = ratio + '%';
 $('share-a').textContent = money(a); $('share-b').textContent = money(b);
 $('split-bar').style.width = ratio + '%';
 $('settlement').textContent = b ? `Partner B owes Partner A ${money(b)}.` : 'Partner A covers this one. Nothing to settle.';
 if(announce) $('partner-message').textContent = `A ${ratio}% / ${100-ratio}% split. The contribution is visible to both people.`;
}
$('split-ratio').addEventListener('input', () => split());
$('equal-split').addEventListener('click', () => { $('split-ratio').value = 50; split(); });
$('plan-wish').addEventListener('click', () => {
 if(wishAdded) return;
 wishAdded = true; $('wish-task').hidden = false;
 $('plan-wish').disabled = true; $('plan-wish').textContent = 'Added to our plans ✓';
 $('wish-feedback').textContent = 'A Sunday by the sea is now a shared task. Choose a date together.';
 $('view-wish-task').hidden = false;
 $('partner-message').textContent = 'One shared wish now has a next step: a Sunday by the sea.';
 updateTasks(false); celebrate();
});
$('view-wish-task').addEventListener('click', () => { $('plan-tab').click(); $('plan-tab').focus(); });
$('reset-cup').addEventListener('click', () => {
 wishAdded=false; tasks.forEach(t => t.checked=false); $('wish-task').hidden=true;
 $('split-ratio').value=50; split(false); updateTasks(false);
 $('plan-wish').disabled=false; $('plan-wish').innerHTML='Make it a plan <span aria-hidden="true">↗</span>';
 $('wish-feedback').textContent='Keep the idea. Give it a next step.'; $('view-wish-task').hidden=true;
 $('partner-message').textContent='Start with a wish. Give it a next step together.'; $('wish-tab').click();
});
document.querySelectorAll('[data-demo-target]').forEach(control => control.addEventListener('click', () => {
 $(control.dataset.demoTarget).click();
 if (control.tagName === 'BUTTON') $(control.dataset.demoTarget).focus();
}));
// Preserve links to the former screenshot section within the product journey.
if (location.hash === '#screens') location.replace('#intent');
const confirmations = [...document.querySelectorAll('[data-confirm]')];
confirmations.forEach(b => b.addEventListener('click', () => {
 const on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed',String(on));
 b.querySelector('span').textContent=on?'Confirmed ✓':'Confirm +';
 const n = confirmations.filter(c => c.getAttribute('aria-pressed')==='true').length;
 $('agreement-state').textContent = n===2?'Agreed, together. Both partners have confirmed.':n===1?'One person has confirmed. Waiting for the other voice.':'An idea for now. Both people need to confirm.';
 document.querySelector('.cup-agreement').classList.toggle('is-agreed',n===2);
}));
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
if ('IntersectionObserver' in window && !reduced.matches) {
 const observer = new IntersectionObserver(entries => entries.forEach(e => {if(e.isIntersecting){e.target.classList.add('is-revealed');observer.unobserve(e.target);}}),{threshold:.08});
 document.querySelectorAll('[data-reveal]').forEach(el => {if(el.getBoundingClientRect().top>innerHeight){el.classList.add('will-reveal');observer.observe(el);}});
}
})();
