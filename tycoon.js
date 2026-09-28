import * as game from './assets/tycoon/play/game.js';
const $ = s => document.querySelector(s);
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const money = value => `£${value.toLocaleString('en-GB')}`;
const dice = {die1:1, die2:2, total:3};
let state, completed = false, moving = false, animationVersion = 0;
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
function setup(){
  animationVersion++;
  state = game.createInitialState(['Player 1','Player 2']);
  const firstCard = game.CHANCE_CARDS.find(card => card.id === 'chance-3');
  state.cardDeck = [firstCard, ...state.cardDeck.filter(card => card.id !== firstCard.id)];
  completed = false; moving = false;
  $('#tile-detail').textContent = 'Select a campus space to see its role.';
  render();
}
function tileLayout(i){
  const side = 100/7, small=(100-2*side)/6;
  if(i<=6)return [i*side,0,side,side];
  if(i<=12)return [100-side,side+(i-7)*small,side,small];
  if(i<=18)return [100-(i-12)*100/6,100-side,100/6,side];
  return [0,100-side-(i-18)*small,side,small];
}
const special = {start:'Pass or land here to receive £100.',research:'Land here to receive £50.',tutorial:'Land here to receive £100 for tutor feedback.',acex:'Workshop material cost: £50.',finalSubmission:'Pay £100, or discard a Chance card to cover the cost.'};
const board = $('#demo-board');
function renderBoard(){
  board.querySelectorAll('.ct-tile').forEach(e=>e.remove());
  state.board.forEach(tile=>{
    const button=document.createElement('button');button.type='button';button.className=`ct-tile ${tile.type!=='property'?'special':''}`;button.dataset.tile=tile.id;
    const [x,y,w,h]=tileLayout(tile.id);Object.assign(button.style,{left:`${x}%`,top:`${y}%`,width:`${w}%`,height:`${h}%`});
    const title=document.createElement('span');title.textContent=tile.name;button.append(title);
    if(tile.type==='property'){const price=document.createElement('small');price.textContent=tile.ownerId?'Owned':money(tile.price);button.append(price);}
    const players=state.players.filter(p=>p.position===tile.id);
    players.forEach(p=>{const token=document.createElement('span');token.className='ct-token';token.style.background=p.id===1?'#b27261':'#608b9a';token.setAttribute('aria-hidden','true');button.append(token);});
    if(players.some(p=>p.id===game.getCurrentPlayer(state).id))button.dataset.current='true';
    if(tile.ownerId)button.dataset.owned='true';
    const detail=tile.type==='property'?`${money(tile.price)} to buy · ${money(tile.rent)} rent${tile.ownerId?' · Owned by Player '+tile.ownerId:''}.`:special[tile.type];
    button.setAttribute('aria-label',`${tile.name}. ${detail}${players.length?' '+players.map(p=>p.name).join(' and ')+' here.':''}`);
    button.addEventListener('click',()=>{$('#tile-detail').textContent=`${tile.name} — ${detail}`;});board.append(button);
  });
}
const phaseInfo = {
  roll:[0,'Where will you land?','Roll two dice to travel around campus. This example uses 1 + 2 to land on Boarding Room.','Your first move.',[['roll','Roll dice']]],
  buyDecision:[1,'A place of your own?','Boarding Room costs £152. Choose to buy it or keep your cash. The next action follows your decision.','Buy or pass?',[['buy','Buy · £152'],['skip','Skip buying']]],
  drawChoice:[2,'A little campus luck.','The space is resolved. Draw one card from the shared Chance + Fate deck before ending the turn.','Draw a card.',[['draw','Draw a card']]],
  cardDecision:[2,'Use it, or save it.','Use this card for £100 now, or keep it for a later held-card window. Each player can hold only one card.','Chance changes things.',[['use','Use · +£100'],['keep','Keep card']]],
  heldCardWindow:[3,'Leave room for a response.','Other players may use a held card on the current player before the turn ends. Player 2 has none in this example.','A moment to respond.',[['finish','End turn']]]
};
function render(){
  renderBoard();
  const info=completed?[4,'Over to Player 2.','The board keeps its ownership, cash and card changes. Player 2 can now begin a new turn in the full game.','A new turn begins.',[['reset','Try again']]]:phaseInfo[state.phase];
  if(!info)return;
  const [step,title,description,centre,actions]=info;
  $('#demo-player').textContent=game.getCurrentPlayer(state).name;$('#demo-cash').textContent=money(game.getCurrentPlayer(state).money);
  $('#turn-label').textContent=`0${step+1} / ${['ROLL','RESOLVE','CARD DECISION','HELD-CARD WINDOW','NEXT PLAYER'][step]}`;
  $('#turn-title').textContent=title;$('#turn-description').textContent=description;$('#board-phase').textContent=centre;
  $('#board-dice').textContent=state.dice?'⚀ + ⚁':'⚀ ⚁';
  document.querySelectorAll('.ct-steps li').forEach((e,i)=>{if(i===step)e.setAttribute('aria-current','step');else e.removeAttribute('aria-current');});
  const card=$('#demo-card');card.hidden=!state.drawnCard;card.replaceChildren();
  if(state.drawnCard){const tag=document.createElement('span');tag.textContent='CHANCE / '+state.drawnCard.id;const title=document.createElement('strong');title.textContent=state.drawnCard.name;const effect=document.createElement('p');effect.textContent=state.drawnCard.effectText;card.append(tag,title,effect);}
  $('#turn-event').textContent=state.gameLog[0];
  $('#turn-actions').replaceChildren(...actions.map(([action,label],i)=>{const b=document.createElement('button');b.type='button';b.className='ct-button'+(i?' secondary':'');b.dataset.action=action;b.textContent=label;return b;}));
}
$('#turn-actions').addEventListener('click',async event=>{
  const button=event.target.closest('[data-action]');if(!button||moving)return;
  const action=button.dataset.action;
  if(action==='reset'){setup();$('#turn-actions button').focus({preventScroll:true});return;}
  if(action==='roll'){
    moving=true;button.disabled=true;button.textContent='Moving…';const version=++animationVersion;
    if(!reduced.matches)for(let i=1;i<=3;i++){board.querySelector(`[data-tile="${i}"]`).classList.add('is-travel');await wait(180);if(version!==animationVersion)return;}
    state=game.takeTurn(state,dice);moving=false;
  }else if(action==='buy')state=game.buyProperty(state,1);
  else if(action==='skip')state=game.skipBuyProperty(state,1);
  else if(action==='draw')state=game.drawEndCard(state);
  else if(action==='use')state=game.useDrawnCard(state,1);
  else if(action==='keep')state=game.keepDrawnCard(state,1);
  else if(action==='finish'){state=game.finishTurn(state);completed=true;}
  render();$('#turn-actions button').focus({preventScroll:true});
});
$('#reset-turn').addEventListener('click',setup);
setup();
const layers=[
 ['ACTION GATING','A decision, at the right moment.','The interface shows actions for the current phase: buy or skip a property, then draw and use, keep or replace a card. A held-card window comes before End Turn.'],
 ['INDEPENDENT RULE MODULE','One state describes the game.','game.js updates plain JavaScript objects for players, board ownership, cards and turn phase. It has no DOM dependency, so the same rules power the game, this walkthrough and behavioural tests.'],
 ['VISIBLE STATE','The interface tells you what changed.','main.js renders the board, player cards and event log from state. Player colours connect position and ownership; available controls reflect the active turn phase.']
];
document.querySelectorAll('[data-layer]').forEach(button=>button.addEventListener('click',()=>{
 document.querySelectorAll('[data-layer]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
 const [tag,title,description]=layers[Number(button.dataset.layer)];$('#layer-tag').textContent=tag;$('#layer-title').textContent=title;$('#layer-description').textContent=description;
}));
const checkCases=[
 ()=>{let s=game.createInitialState(['A','B']);s.players[0].position=24;const out=game.movePlayer(s,1,3);return out.players[0].position===2&&out.players[0].money===1100;},
 ()=>{const s=game.takeTurn(game.createInitialState(['A','B']),dice);const out=game.buyProperty(s,1);return out.players[0].money===1000-s.board[3].price&&out.board[3].ownerId===1&&out.phase==='drawChoice';},
 ()=>{let s=game.skipBuyProperty(game.takeTurn(game.createInitialState(['A','B']),dice),1);s=game.keepDrawnCard(game.drawEndCard(s),1);return s.players[0].hand.length===1&&s.phase==='heldCardWindow';},
 ()=>{const s=game.createInitialState(['A','B']);s.currentPlayerIndex=1;s.players[1].money=1;s.board[3].ownerId=1;s.players[0].properties=[3];const out=game.takeTurn(s,dice);return out.players[1].bankrupt&&out.winner?.id===1&&out.phase==='gameOver';}
];
$('#run-checks').addEventListener('click',async()=>{
 const button=$('#run-checks');button.disabled=true;button.textContent='Checking…';let passed=0;
 const rows=[...document.querySelectorAll('#rule-checks li')];rows.forEach(row=>{row.className='';row.lastElementChild.textContent='Ready';});
 for(let i=0;i<checkCases.length;i++){rows[i].lastElementChild.textContent='Running…';if(!reduced.matches)await wait(200);let okay=false;try{okay=checkCases[i]();}catch(error){console.error(error);}rows[i].className=okay?'pass':'fail';rows[i].lastElementChild.textContent=okay?'✓ Passed':'× Failed';if(okay)passed++;}
 $('#check-status').textContent=`${passed} of 4 live checks passed against the original rule module. The full Mocha suite was run separately.`;button.disabled=false;button.textContent='Run checks again ↗';
});
$('#launch-game').addEventListener('click',()=>{const frame=$('#full-game');frame.src='assets/tycoon/play/index.html';frame.hidden=false;$('#game-launch').hidden=true;frame.focus();});
const nav=[...document.querySelectorAll('.case-nav a')];const sections=nav.map(a=>document.querySelector(a.hash));let ticking=false;
function reading(){ticking=false;const total=document.documentElement.scrollHeight-innerHeight;$('.reading-progress').style.transform=`scaleX(${total>0?scrollY/total:0})`;let current=-1;sections.forEach((s,i)=>{if(s.getBoundingClientRect().top<=160)current=i;});nav.forEach((a,i)=>{if(i===current)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});}
function schedule(){if(!ticking){ticking=true;requestAnimationFrame(reading);}}
addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);reading();
if('IntersectionObserver' in window&&!reduced.matches){const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-revealed');observer.unobserve(e.target);}}),{threshold:.08});document.querySelectorAll('[data-reveal]').forEach(e=>{if(e.getBoundingClientRect().top>innerHeight){e.classList.add('will-reveal');observer.observe(e);}});}
document.fonts.ready.then(()=>{
  if(location.hash){const target=document.getElementById(location.hash.slice(1));target?.scrollIntoView({block:'start',behavior:'instant'});}
  schedule();
});
