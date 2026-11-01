// @ts-nocheck -- compact numeric code ported 1:1 from v5 qr.js
/* Minimal QR Code generator (byte mode, ECC level M, versions 1-6, best-mask selection). No dependencies. */

const EC={1:[10,1,16,0,0],2:[16,1,28,0,0],3:[26,1,44,0,0],4:[18,2,32,0,0],5:[24,2,43,0,0],6:[16,4,27,0,0]};
const AL={1:[],2:[6,18],3:[6,22],4:[6,26],5:[6,30],6:[6,34]};
function mul(x,y){let z=0;for(let i=7;i>=0;i--){z=(z<<1)^((z>>>7)*0x11D);z^=((y>>>i)&1)*x;}return z&255}
function divisor(d){const r=new Array(d).fill(0);r[d-1]=1;let root=1;for(let i=0;i<d;i++){for(let j=0;j<d;j++){r[j]=mul(r[j],root);if(j+1<d)r[j]^=r[j+1];}root=mul(root,2);}return r}
function rem(data,div){const r=new Array(div.length).fill(0);for(const b of data){const f=b^r.shift();r.push(0);div.forEach((c,i)=>r[i]^=mul(c,f));}return r}
export function encode(text){
  const bytes=Array.from(new TextEncoder().encode(text));let v=1;
  for(;v<=6;v++){const e=EC[v];if(4+8+8*bytes.length<=(e[1]*e[2]+e[3]*e[4])*8)break;}
  if(v>6)throw new Error('QR text too long');
  const [ecl,b1,d1,b2,d2]=EC[v],cap=b1*d1+b2*d2;
  const bits=[];const put=(val,n)=>{for(let i=n-1;i>=0;i--)bits.push((val>>>i)&1)};
  put(4,4);put(bytes.length,8);bytes.forEach(b=>put(b,8));put(0,Math.min(4,cap*8-bits.length));while(bits.length%8)bits.push(0);
  const cw=[];for(let i=0;i<bits.length;i+=8)cw.push(parseInt(bits.slice(i,i+8).join(''),2));
  for(let p=0;cw.length<cap;p++)cw.push(p%2?0x11:0xEC);
  const div=divisor(ecl),blocks=[];let k=0;
  for(let i=0;i<b1+b2;i++){const n=i<b1?d1:d2;const d=cw.slice(k,k+n);k+=n;blocks.push({d,e:rem(d,div)});}
  const out=[];const mx=Math.max(d1,d2);
  for(let i=0;i<mx;i++)blocks.forEach(b=>{if(i<b.d.length)out.push(b.d[i])});
  for(let i=0;i<ecl;i++)blocks.forEach(b=>out.push(b.e[i]));
  const size=17+4*v,M=[...Array(size)].map(()=>Array(size).fill(false)),F=[...Array(size)].map(()=>Array(size).fill(false));
  const set=(x,y,val)=>{M[y][x]=!!val;F[y][x]=true};
  for(let i=0;i<size;i++){set(6,i,i%2==0);set(i,6,i%2==0);}
  [[3,3],[size-4,3],[3,size-4]].forEach(([cx,cy])=>{for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++){const d=Math.max(Math.abs(dx),Math.abs(dy)),x=cx+dx,y=cy+dy;if(x>=0&&x<size&&y>=0&&y<size)set(x,y,d!=2&&d!=4);}});
  const al=AL[v],L=al.length;for(let i=0;i<L;i++)for(let j=0;j<L;j++){if((i==0&&j==0)||(i==0&&j==L-1)||(i==L-1&&j==0))continue;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)set(al[i]+dx,al[j]+dy,Math.max(Math.abs(dx),Math.abs(dy))!=1);}
  const MASKS=[(x,y)=>(x+y)%2==0,(x,y)=>y%2==0,(x,y)=>x%3==0,(x,y)=>(x+y)%3==0,(x,y)=>(Math.floor(y/2)+Math.floor(x/3))%2==0,(x,y)=>x*y%2+x*y%3==0,(x,y)=>(x*y%2+x*y%3)%2==0,(x,y)=>((x+y)%2+x*y%3)%2==0];
  const fmt=(mask)=>{const data=(0<<3)|mask;let r=data;for(let i=0;i<10;i++)r=(r<<1)^((r>>>9)*0x537);const fb=((data<<10)|r)^0x5412,gb=i=>(fb>>>i)&1;
    for(let i=0;i<=5;i++)set(8,i,gb(i));set(8,7,gb(6));set(8,8,gb(7));set(7,8,gb(8));for(let i=9;i<15;i++)set(14-i,8,gb(i));
    for(let i=0;i<8;i++)set(size-1-i,8,gb(i));for(let i=8;i<15;i++)set(8,size-15+i,gb(i));set(8,size-8,1);};
  fmt(0);
  let i=0;for(let right=size-1;right>=1;right-=2){if(right==6)right=5;for(let vert=0;vert<size;vert++)for(let j=0;j<2;j++){const x=right-j,up=((right+1)&2)==0,y=up?size-1-vert:vert;if(!F[y][x]&&i<out.length*8){M[y][x]=((out[i>>>3]>>>(7-(i&7)))&1)==1;i++;}}}
  const applyMask=m=>{for(let y=0;y<size;y++)for(let x=0;x<size;x++)if(!F[y][x]&&MASKS[m](x,y))M[y][x]=!M[y][x];};
  const penalty=()=>{let p=0;const line=get=>{let run=1,prev=get(0),seq=[];for(let k=1;k<size;k++){const c=get(k);if(c===prev){run++;}else{if(run>=5)p+=run-2;run=1;prev=c;}}if(run>=5)p+=run-2;
      const bits=[];for(let k=0;k<size;k++)bits.push(get(k)?1:0);const str=bits.join('');for(const pat of ['10111010000','00001011101']){let at=str.indexOf(pat);while(at>=0){p+=40;at=str.indexOf(pat,at+1);}}};
    for(let y=0;y<size;y++)line(k=>M[y][k]);for(let x=0;x<size;x++)line(k=>M[k][x]);
    let dark=0;for(let y=0;y<size;y++)for(let x=0;x<size;x++){if(M[y][x])dark++;if(x<size-1&&y<size-1){const c=M[y][x];if(M[y][x+1]===c&&M[y+1][x]===c&&M[y+1][x+1]===c)p+=3;}}
    p+=Math.floor(Math.abs(dark*20-size*size*10)/(size*size))*10;return p;};
  let best=0,bestP=Infinity;for(let m=0;m<8;m++){applyMask(m);fmt(m);const pp=penalty();if(pp<bestP){bestP=pp;best=m;}applyMask(m);}
  applyMask(best);fmt(best);
  return M;
}
