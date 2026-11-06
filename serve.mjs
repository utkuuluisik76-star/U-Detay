import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,sep,extname} from 'node:path';
const root=resolve(fileURLToPath(new URL('./dist/',import.meta.url)));
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.glb':'model/gltf-binary','.wasm':'application/wasm','.woff2':'font/woff2','.svg':'image/svg+xml','.webp':'image/webp','.jpg':'image/jpeg','.txt':'text/plain; charset=utf-8'};
createServer(async(req,res)=>{try{const p=decodeURIComponent(new URL(req.url,'http://local').pathname);const f=resolve(root,'.'+(p==='/'?'/index.html':p));if(!f.startsWith(root+sep)&&f!==resolve(root,'index.html')){res.writeHead(403).end();return;}const b=await readFile(f);res.writeHead(200,{'Content-Type':mime[extname(f)]||'application/octet-stream','Content-Length':b.length,'X-Robots-Tag':'noindex, nofollow','Cache-Control':'no-cache'});res.end(req.method==='HEAD'?undefined:b);}catch{res.writeHead(404).end('Not found');}}).listen(Number(process.env.PORT||4182),'127.0.0.1',()=>console.log('Local: http://127.0.0.1:'+(process.env.PORT||4182)));
