const express = require('express');
const http = require('http');
const fs = require('fs');
const pfs = fs.promises;

const app = express();
app.use(express.static('public'));

const host = 'localhost';
const port = 8080;

const server = http.createServer(app);
server.listen(port, host, () => {
  console.log(`koxel server running on http://${host}:${port}`);
});

// compress src into one js file
let getSrc = (dir) => new Promise(async (resolve, reject) => {
  let out = '';
  for (let f of fs.readdirSync(dir)) {
    if (f.endsWith('js')) {
      let d = await pfs.readFile(dir + f, 'utf8');
      out += `\n/** ${dir + f} **/\n\n${d}\n\n`;
    } else if (f.endsWith('glsl')) {
      let d = await pfs.readFile(dir + f, 'utf8');
      out += `\n/** ${dir + f} **/\n\nconst ${f.split('.')[0]}GLSL = \n\` ${d.split('\n').join('\n  ')}\`;\n\n`
    } else out += await getSrc(dir + f + '/');
  }
  resolve(out);
});

(async function () {
  const src = await getSrc('./src/');
  fs.writeFileSync('./public/koxel.js', src);
})();
