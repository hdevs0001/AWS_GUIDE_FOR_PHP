(function(){
var esc=function(s){return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")};
var hl=function(s){return esc(s).split("\n").map(function(l){
 if(/^\s*#(?!!)/.test(l))return '<span class="cm">'+l+'</span>';
 return l.replace(/^(\s*)(sudo|apt|systemctl|rm|git|chown|chmod|sed|echo|cd|set|ssh|nano)\b/,'$1<span class="kw">$2</span>').replace(/(https?:\/\/[^\s]+|"[^"]*")/g,'<span class="st">$1</span>')}).join("\n")};
var store={get:function(k){try{return localStorage.getItem(k)}catch(e){return null}},set:function(k,v){try{localStorage.setItem(k,v)}catch(e){}}};

var USERDATA='#!/bin/bash\n\n# Stop if any command fails\nset -e\n\n# Update Ubuntu packages\napt update -y\napt upgrade -y\n\n# Install required packages\napt install -y apache2 git php libapache2-mod-php\n\n# Start Apache and enable it on boot\nsystemctl enable apache2\nsystemctl start apache2\n\n# Remove the default Apache website files\nrm -rf /var/www/html/*\n\n# Clone your GitHub repository into Apache\'s root directory\ngit clone https://github.com/hdevs0001/AWS_SERVICES_LEARNING.git /var/www/html\n\n# Set proper permissions\nchown -R www-data:www-data /var/www/html\nchmod -R 755 /var/www/html\n\n# Make PHP the default index file\nsed -i \'s/DirectoryIndex.*/DirectoryIndex index.php index.html/\' /etc/apache2/mods-enabled/dir.conf\n\n# Restart Apache\nsystemctl restart apache2\n\n# Log completion\necho "Website deployment completed successfully!"';
var DEPLOY='#!/bin/bash\n\nset -e\n\necho "Starting deployment..."\n\ncd /var/www/html\n\n# Download latest GitHub changes\ngit -c safe.directory=/var/www/html fetch origin main\n\n# Make EC2 exactly match GitHub main\ngit -c safe.directory=/var/www/html reset --hard origin/main\n\necho "Deployment completed successfully!"';

var TABS=[
{name:"Initial Deployment",desc:"Deploy your PHP website from GitHub to an AWS EC2 Ubuntu server.",steps:[
{t:"Prepare Your Development Environment",p:"Before you start, make sure you have these five things ready.",x:"reqs"},
{t:"Create Your PHP Project and Push to GitHub",p:"Create a PHP project in VS Code and make sure <b>index.php</b> exists in the root directory. Then initialize Git, create a GitHub repository, and push. Run these in the VS Code terminal:",code:["git init\ngit add .\ngit commit -m \"Initial commit\"\ngit branch -M main\ngit remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git\ngit push -u origin main"],warn:"The repository should be <b>public</b> for the simple unauthenticated clone method used in this tutorial."},
{t:"Launch an AWS EC2 Instance",p:"In the AWS Management Console: search for <b>EC2</b>, open the EC2 Dashboard, then click <b>Launch Instance</b>. Name it <b>PHP-Website-Server</b> and choose <b>Ubuntu Server 24.04 LTS</b>. Pick an instance type eligible for your account’s free-tier offer, if available. Create or select a key pair, then configure the Security Group with these inbound rules:",x:"sg",after:"Port 80 is necessary for public website access. Keep SSH limited to your own IP."},
{t:"Configure Advanced Details and Add User Data",p:"Go to <b>EC2 → Launch Instance → Advanced Details → User Data</b> and paste this complete Bash script. It runs automatically on first boot. Replace the repository URL with your own if needed.",code:[USERDATA],ex:[["apt install apache2","Installs Apache."],["apt install php","Installs PHP."],["apt install git","Installs Git."],["rm -rf /var/www/html/*","Removes default Apache files."],["git clone","Downloads the GitHub project."],["chown","Sets ownership for Apache."],["chmod","Sets file permissions."],["systemctl restart apache2","Restarts the web server."]],warn:"This script <b>deletes existing contents of /var/www/html</b>. Use it only on a fresh deployment directory. The repository must be public so it can be cloned without credentials."},
{t:"Launch the Instance and Wait",p:"Click <b>Launch Instance</b>, then open <b>EC2 → Instances</b> and work through this checklist:",x:"wait"},
{t:"Open Your Live PHP Website",p:"Your site is ready. Enter your EC2 public IP below to build the URL, open the site, or generate a QR code.",x:"ip"}]},
{name:"Update & Redeploy",desc:"Push your latest code to GitHub and deploy it to your EC2 server.",steps:[
{t:"Connect to Your EC2 Machine Using SSH",p:"Connect to your Ubuntu instance with your private key. Replace <b>your-key.pem</b> with your key filename and <b>YOUR_EC2_PUBLIC_IP</b> with the instance’s public IP. The security group must allow SSH from your IP.",code:["ssh -i \"your-key.pem\" ubuntu@YOUR_EC2_PUBLIC_IP"],flow:"VS Code → GitHub Push → EC2 Deployment Script → Live Website Updated"},
{t:"Navigate to Apache’s Website Directory",p:"Apache serves the website from <b>/var/www/html</b>.",code:["cd /var/www/html"]},
{t:"Create a Deployment Script",p:"We’ll create a reusable Bash script so you don’t type several Git commands every time.",code:["sudo nano /usr/local/bin/deploy-website"]},
{t:"Add the Deployment Script",p:"Paste this into nano. It downloads the latest GitHub changes and makes the server match the <b>main</b> branch. Save with Ctrl+O, Enter, then exit with Ctrl+X.",code:[DEPLOY],ex:[["set -e","Stops execution when a command fails."],["cd /var/www/html","Opens the website directory."],["git fetch","Downloads the latest GitHub changes."],["git reset --hard origin/main","Updates the server to exactly match GitHub’s main branch."],["echo","Prints deployment status."],["safe.directory","Apache owns the website files, while the command runs with elevated privileges. This avoids Git’s dubious ownership warning."]],warn:"<b>git reset --hard origin/main</b> permanently discards local modifications to tracked files on EC2. GitHub must be the source of truth. Don’t use this approach if server-side code changes need to be preserved."},
{t:"Make the Script Executable",p:"Linux needs executable permission before the script can run.",code:["sudo chmod +x /usr/local/bin/deploy-website"]},
{t:"Deploy Your Latest Changes",p:"After you edit a PHP file locally and push it to GitHub, just connect to EC2 and run:",code:["sudo deploy-website"],out:"Starting deployment...\nFrom https://github.com/hdevs0001/AWS_SERVICES_LEARNING\nHEAD is now at cb5b265 ...\nDeployment completed successfully!",note:"The commit hash will vary with each deployment."},
{t:"Verify the Deployment",p:"Check the latest deployed commit, then open the EC2 public IP in your browser to see the updated PHP website.",code:["sudo git -C /var/www/html log -1 --oneline"]}]}];

var WF=[["Initial deployment",["VS Code","GitHub","AWS EC2 User Data","Apache2 + PHP","Live Website"]],["Code updates",["Edit PHP","Git Commit","Git Push","SSH into EC2","Run deploy-website","Updated Website"]]];
document.getElementById("wf").innerHTML=WF.map(function(w){return '<div class="row"><h3>'+w[0]+'</h3>'+w[1].map(function(c){return '<span class="chip">'+c+'</span>'}).join('<span class="arr"></span>')+'</div>'}).join("");

var cur=+store.get("tab")||0,done={};try{done=JSON.parse(store.get("done")||"{}")}catch(e){}
var ip=store.get("ip")||"";
var panel=document.getElementById("panel"),seg=document.getElementById("seg");

function codeBlock(c){return '<div class="code"><pre><code>'+hl(c)+'</code></pre><button class="cp" data-c="1">Copy</button></div>'}
function extra(s){
 if(s.x==="reqs")return '<div class="grid">'+[["💻","VS Code","Write and manage PHP code."],["🔀","Git","Track and push code changes."],["🐙","GitHub account","Host your source code."],["☁️","AWS account","Launch an EC2 virtual machine."],["🐘","PHP project","Contains an index.php file."]].map(function(r){return '<div class="rq"><span>'+r[0]+'</span><b>'+r[1]+'</b><small>'+r[2]+'</small></div>'}).join("")+'</div>';
 if(s.x==="sg")return '<table><thead><tr><th>Type</th><th>Port</th><th>Source</th></tr></thead><tbody><tr><td>SSH</td><td>22</td><td>My IP</td></tr><tr><td>HTTP</td><td>80</td><td>Anywhere IPv4</td></tr></tbody></table>';
 if(s.x==="wait")return '<ul class="ck"><li>Instance State shows <b>Running</b></li><li>Status Checks show <b>2/2 checks passed</b></li><li>Copy the <b>Public IPv4 address</b></li></ul>';
 if(s.x==="ip")return '<div class="ipbox"><input id="ip" inputmode="decimal" autocomplete="off" placeholder="e.g. 3.110.25.40" aria-label="EC2 public IP" value="'+esc(ip)+'"></div><div class="err" id="err" role="alert"></div><p>URL template: <b>http://YOUR_EC2_PUBLIC_IP</b></p><div class="acts" style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn pri" id="openbtn">Open Live Website</button><button class="btn" id="qrbtn">Show QR Code</button></div>';
 return "";}
function render(){
 var T=TABS[cur];seg.dataset.t=cur;
 [0,1].forEach(function(i){document.getElementById("tab"+i).setAttribute("aria-selected",i===cur)});
 document.getElementById("tdesc").textContent=T.desc;
 var h='<div class="panel"><div class="tl">';
 T.steps.forEach(function(s,i){var id=cur+"-"+i;
  h+='<article class="step'+(done[id]?" done":"")+'" id="s'+id+'" data-id="'+id+'"><div class="num">'+(i+1)+'</div><label class="chk"><input type="checkbox" '+(done[id]?"checked":"")+'> Done</label><h3>'+s.t+'</h3><p>'+s.p+'</p>'+(s.flow?'<p><span class="chip">'+s.flow+'</span></p>':'')+extra(s)+(s.after?'<p>'+s.after+'</p>':'')+(s.code||[]).map(codeBlock).join("")+(s.out?'<div class="out"><b>Expected output</b>'+esc(s.out)+'</div>':'')+(s.note?'<p>'+s.note+'</p>':'')+(s.ex?'<details><summary>What does each command do?</summary><dl>'+s.ex.map(function(e){return '<dt>'+esc(e[0])+'</dt><dd>'+esc(e[1])+'</dd>'}).join("")+'</dl></details>':'')+(s.warn?'<div class="warn">⚠️ '+s.warn+'</div>':'')+'</article>';});
 panel.innerHTML=h+'</div></div>';
 // map copy text
 var blocks=[];T.steps.forEach(function(s){(s.code||[]).forEach(function(c){blocks.push(c)})});
 panel.querySelectorAll(".cp").forEach(function(b,i){b.dataset.i=i});
 panel.__blocks=blocks;
 progress();observe();bindIP();
}
function progress(){var n=TABS[cur].steps.length,d=0;TABS[cur].steps.forEach(function(s,i){if(done[cur+"-"+i])d++});
 document.getElementById("pt").textContent=d+" / "+n+" steps";document.getElementById("pb").style.width=(d/n*100)+"%"}
var io;function observe(){
 var reduce=matchMedia("(prefers-reduced-motion:reduce)").matches;
 if(io)io.disconnect();
 io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("show")}})},{threshold:.08});
 panel.querySelectorAll(".step").forEach(function(s){reduce?s.classList.add("show"):io.observe(s)});}
function setActive(){var best=null,bd=1e9,y=innerHeight*.35;
 panel.querySelectorAll(".step").forEach(function(s){var r=s.getBoundingClientRect();var d=r.top<=y&&r.bottom>=y?0:Math.min(Math.abs(r.top-y),Math.abs(r.bottom-y));if(d<bd){bd=d;best=s}});
 panel.querySelectorAll(".step").forEach(function(s){s.classList.toggle("active",s===best)})}

panel.addEventListener("click",function(e){
 var b=e.target.closest(".cp");
 if(b){var txt=panel.__blocks[+b.dataset.i];
  var ok=function(){b.textContent="✓ Copied!";b.classList.add("ok");setTimeout(function(){b.textContent="Copy";b.classList.remove("ok")},1600)};
  var fb=function(){var t=document.createElement("textarea");t.value=txt;t.style.position="fixed";t.style.opacity="0";document.body.appendChild(t);t.select();try{document.execCommand("copy");ok()}catch(x){b.textContent="Press Ctrl+C"}document.body.removeChild(t)};
  (navigator.clipboard&&navigator.clipboard.writeText)?navigator.clipboard.writeText(txt).then(ok,fb):fb();}
});
panel.addEventListener("change",function(e){if(e.target.type!=="checkbox")return;var st=e.target.closest(".step"),id=st.dataset.id;
 if(e.target.checked)done[id]=1;else delete done[id];st.classList.toggle("done",!!done[id]);store.set("done",JSON.stringify(done));progress()});

function validIP(v){var m=/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(v.trim());return !!m&&m.slice(1).every(function(o){return +o<=255&&String(+o)===o||o==="0"})}
function url(){return "http://"+ip.trim()}
function bindIP(){var inp=document.getElementById("ip");if(!inp)return;
 var err=document.getElementById("err");
 inp.addEventListener("input",function(){ip=inp.value;store.set("ip",ip);inp.removeAttribute("aria-invalid");err.textContent=""});
 var check=function(){ip=inp.value;if(!validIP(ip)){inp.setAttribute("aria-invalid","true");err.textContent="Enter a valid IPv4 address, like 3.110.25.40.";inp.focus();return false}return true};
 document.getElementById("openbtn").onclick=function(){if(check())window.open(url(),"_blank","noopener")};
 document.getElementById("qrbtn").onclick=function(){if(check())openQR(url())};}

var modal=document.getElementById("modal"),qr=document.getElementById("qr"),lastFocus;
var GUIDE="https://aws-guide-for-php.vercel.app/",target="";
function openQR(u,title,msg){target=u||url();lastFocus=document.activeElement;qr.innerHTML="";document.getElementById("mt").textContent=title||"Scan to open";document.getElementById("qmsg").textContent=msg||"Scan this QR code to open your live PHP website.";
 try{new QRCode(qr,{text:target,width:220,height:220,correctLevel:QRCode.CorrectLevel.M})}catch(e){qr.textContent="QR library failed to load."}
 document.getElementById("qurl").textContent=target;modal.classList.add("open");document.getElementById("qopen").focus()}
function closeQR(){modal.classList.remove("open");if(lastFocus)lastFocus.focus()}
qr.onclick=function(){window.open(target,"_blank","noopener")};
document.getElementById("qopen").onclick=qr.onclick;
document.getElementById("qclose").onclick=closeQR;
modal.addEventListener("click",function(e){if(e.target===modal)closeQR()});
addEventListener("keydown",function(e){if(e.key==="Escape"&&modal.classList.contains("open"))closeQR()});
document.getElementById("qcopy").onclick=function(){var b=this,t=target;var ok=function(){b.textContent="✓ Copied!";setTimeout(function(){b.textContent="Copy URL"},1600)};
 navigator.clipboard&&navigator.clipboard.writeText?navigator.clipboard.writeText(t).then(ok,function(){}):ok()};

[0,1].forEach(function(i){document.getElementById("tab"+i).onclick=function(){if(cur===i)return;cur=i;store.set("tab",i);render()}});
document.querySelectorAll(".guide-qr").forEach(function(b){b.onclick=function(){openQR(GUIDE,"Open this guide","Scan this QR code to open the AWS PHP Deployment Guide.")}});
var menu=document.getElementById("menu"),nav=document.getElementById("nav");
menu.onclick=function(){var o=nav.classList.toggle("open");menu.setAttribute("aria-expanded",o)};
nav.addEventListener("click",function(e){if(e.target.tagName==="A"){nav.classList.remove("open");menu.setAttribute("aria-expanded","false")}});
var top=document.getElementById("top");top.onclick=function(){scrollTo({top:0,behavior:matchMedia("(prefers-reduced-motion:reduce)").matches?"auto":"smooth"})};
var tick=false;addEventListener("scroll",function(){if(tick)return;tick=true;requestAnimationFrame(function(){tick=false;top.classList.toggle("on",scrollY>600);setActive()})},{passive:true});
render();setActive();
})();
