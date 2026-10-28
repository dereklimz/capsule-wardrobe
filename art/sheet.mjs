import { chromium } from 'playwright';
import fs from 'fs';
const src = fs.readFileSync('./art/garments.js','utf8');
const cols = { tshirt:'#EFC4CC', 'vneck-tee':'#1E2A4A', polo:'#367D79', henley:'#D1A93A', 'camp-shirt':'#7B8D7A', oxford:'#8FA6C0', 'dress-shirt':'#F7F6F2',
 'crew-knit':'#6C1B26','vneck-knit':'#C19A6B', turtleneck:'#444444', cardigan:'#576047', blazer:'#1E2A4A', overshirt:'#576047', trench:'#C3B091','denim-jacket':'#505D79', bomber:'#3D5431',
 'leather-jacket':'#1C1C1C','wool-coat':'#C19A6B', puffer:'#1E2A4A','light-jacket':'#C3B091', jeans:'#505D79', chinos:'#C3B091', trousers:'#444444','linen-pants':'#F3E0C3', shorts:'#8FA6C0', cords:'#925842','leather-pants':'#1C1C1C',
 sneakers:'#F5F4EF', loafers:'#4A2C20','dress-shoes':'#1C1C1C','chelsea-boots':'#946844', sandals:'#946844','hiking-boots':'#4A2C20' };
const names = { tshirt:'T-shirt','vneck-tee':'V-neck tee',polo:'Polo',henley:'Henley','camp-shirt':'Camp-collar shirt',oxford:'Oxford shirt','dress-shirt':'Dress shirt','crew-knit':'Crewneck sweater','vneck-knit':'V-neck sweater',turtleneck:'Turtleneck',cardigan:'Cardigan',blazer:'Blazer',overshirt:'Overshirt',trench:'Trench coat','denim-jacket':'Denim jacket',bomber:'Bomber','leather-jacket':'Leather jacket','wool-coat':'Wool overcoat',puffer:'Puffer','light-jacket':'Light jacket',jeans:'Jeans',chinos:'Chinos',trousers:'Tailored trousers','linen-pants':'Linen trousers',shorts:'Shorts',cords:'Corduroy pants','leather-pants':'Leather pants',sneakers:'Sneakers',loafers:'Loafers','dress-shoes':'Dress shoes','chelsea-boots':'Chelsea boots',sandals:'Sandals','hiking-boots':'Hiking boots' };
const groups = [['Tops',['tshirt','vneck-tee','polo','henley','camp-shirt','oxford','dress-shirt']],['Sweaters',['crew-knit','vneck-knit','turtleneck','cardigan']],['Outerwear',['blazer','overshirt','trench','denim-jacket','bomber','leather-jacket','wool-coat','puffer','light-jacket']],['Bottoms',['jeans','chinos','trousers','linen-pants','shorts','cords','leather-pants']],['Shoes',['sneakers','loafers','dress-shoes','chelsea-boots','sandals','hiking-boots']]];
const only = process.argv[2];
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
for (const [g, ids] of groups) {
  if (only && only !== g) continue;
  const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
  await p.setContent('<body style="margin:0;background:#f3efe8;font:14px system-ui"></body>');
  await p.addScriptTag({ content: src });
  await p.evaluate(({ ids, cols, names, g }) => {
    const w = document.createElement('div'); w.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);gap:14px;padding:18px';
    w.innerHTML = '<div style="grid-column:1/-1;font:600 20px Georgia">' + g + '</div>' + ids.map(id => `<div style="background:#faf8f4;border:1px solid #e4ded4;border-radius:12px;padding:10px"><div style="height:${g==='Shoes'?150:300}px;"><img style="display:block;width:100%;height:100%;object-fit:contain" src="${Garments.img(id, cols[id])}"></div><div style="font-weight:600;margin-top:6px">${names[id]}</div></div>`).join('');
    document.body.appendChild(w);
  }, { ids, cols, names, g });
  await p.waitForTimeout(300);
  await p.screenshot({ path: `art/sheet-${g}.png`, fullPage: true });
}
await b.close();
