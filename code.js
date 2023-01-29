const canvas = document.getElementById('canvas') 
var ctx = canvas.getContext('2d')

canvas.width  = screen.width
canvas.height = screen.height
const players = []
const enemies = []
const obstacles = []
const bullets = []
const particles = []
const keys = {up:{pressed:false},down:{pressed:false},left:{pressed:false},right:{pressed:false},shift:{pressed:false},mouse1:{pressed:false},R:{pressed:false}}
const camera = {
    x:0,
    y:0,
    mouse:{
        x:0,y:0,multi:40
    }
}
const worldBorder ={
    maxX:300,
    maxY:300
}
const time = {
  sec:00,
  min:00
}
var enemyMax = 4
var fps = 60
var frameCount = 0
var startTime = performance.now()
var playerimg = new Image()
playerimg.src = 'player.png'
var backgroundImg = new Image()
backgroundImg.src = 'floor.jpg'
var obstacleImg = new Image()
obstacleImg.src = 'obstacle.png'
var enemyimg = new Image()
enemyimg.src = 'enemy.png'
setInterval(()=>{
  time.sec += 1
  if (time.sec >= 60){
    time.min += 1
    time.sec = 0
  }
  document.getElementById('timesec').innerHTML = String(time.sec).padStart(2, '0')
  document.getElementById('timemin').innerHTML = String(time.min).padStart(2, '0')
},1000)
class Player{
  constructor(ctx){
    this.ctx = ctx
    this.position = {
        x:canvas.width/2,
        y:canvas.height/2
    }
    this.velocity = {
       x:0,
       y:0
    }
    this.speed = Math.round(280*(1/fps))
    this.size = 30
    this.rect = canvas.getBoundingClientRect()
    this.event = {x:0,y:0}
    this.angle = 0
    this.knockback = {
      x:0,y:0
    }
    this.health = 20
    this.healthbar = false
    this.invisiblity = {bool:false,blink:false}
    this.mag = {
      bullet:10,
      loaded:true,
      reloading:false,
      reloadTime:0
    }
    this.firerate = 200
    
  }
  init(){
    this.draw()
    this.update()
  }
  draw(){
    if (!this.invisiblity.blink){
      this.ctx.save()
    this.ctx.translate(this.position.x+this.size/2,this.position.y+this.size/2)
    this.ctx.rotate(this.angle)
    this.ctx.translate(-this.position.x-this.size/2,-this.position.y-this.size/2)
    this.ctx.drawImage(playerimg,this.position.x,this.position.y,this.size,this.size)
    this.ctx.restore()}
    if (this.healthbar){
      this.ctx.beginPath()
      this.ctx.rect(this.position.x,this.position.y-20,20,7)
      this.ctx.stroke()
      this.ctx.fillStyle = 'green'
      this.ctx.fillRect(this.position.x,this.position.y-20,this.health,7)
      this.ctx.fillStyle = 'black'
    }
  }
  update(){
    if (keys.up.pressed){
        this.velocity.y = -this.speed
        if (camera.y > 0 && this.position.y-this.size/2<=camera.y+canvas.height/2) {
            camera.y -= this.speed}
    }
    else if (keys.down.pressed){
        this.velocity.y = this.speed
        if (camera.y < worldBorder.maxY && this.position.y-this.size/2>=camera.y+canvas.height/2){
            camera.y += this.speed}
    }
    else {this.velocity.y = 0}
    if (keys.left.pressed){
        this.velocity.x = -this.speed
        if (camera.x > 0 && this.position.x-this.size/2<=camera.x+canvas.width/2){
            camera.x -= this.speed}
    }
    else if (keys.right.pressed){
        this.velocity.x = this.speed
        if (camera.x < worldBorder.maxX && this.position.x-this.size/2>=camera.x+canvas.width/2){
            camera.x += this.speed}
    }
    else {this.velocity.x = 0}
    if (keys.mouse1.pressed && this.mag.bullet > 0 && this.mag.loaded && !this.mag.reloading){
        bullets.push(new Bullet(ctx,{x:this.position.x+this.size/2,y:this.position.y+this.size/2},{x:Math.cos(this.angle),y:Math.sin(this.angle)},this.angle))
        this.mag.loaded = false
        this.mag.bullet--
        setTimeout(()=>{
            this.mag.loaded = true
        },this.firerate)
        keys.mouse1.pressed = false
    }
    if ((keys.R.pressed || this.mag.bullet <= 0) && this.mag.bullet < 10 && !this.mag.reloading){
      this.mag.reloading = true
      this.mag.reloadTime = 1.5
      keys.R.pressed = false
      var interval = setInterval(()=>{
            if (this.mag.reloadTime > 0){
              document.getElementById('reloading').innerHTML = Math.round(this.mag.reloadTime*100)/100
              this.mag.reloadTime -= 0.1
            }
            else {clearInterval(interval);document.getElementById('reloading').innerHTML = ''}
      },100)
      setTimeout(()=>{
        this.mag.bullet = 10
        this.mag.reloading = false
      },1500)
    }
    if (this.mag.bullet <= 3 && !this.mag.reloading){
      document.getElementById('reloading').innerHTML = '[R] Reload'
    }
    this.position.x += this.velocity.x + this.knockback.x
    this.position.y += this.velocity.y + this.knockback.y

    if(this.position.x<0){
        this.position.x = 0
      }
      if(this.position.x>(canvas.width)+ worldBorder.maxX-this.size){
        this.position.x = (canvas.width)+ worldBorder.maxX-this.size
      }
      if(this.position.y<0){
        this.position.y = 0
      }
      if(this.position.y>(canvas.height)+ worldBorder.maxY-this.size){
        this.position.y = (canvas.height) + worldBorder.maxY-this.size
      }
      if (this.knockback.x!=0){
        this.knockback.x *= 0.75
      }
      if (this.knockback.y!=0){
        this.knockback.y *= 0.75
      }
      this.angle = rotateAngle(this.event,this,this.rect)
      mouseCamera(this.event,this.rect)
      this.rect = canvas.getBoundingClientRect()
      
  }
}
class Obstacle{
    constructor(ctx,size,position){
      this.ctx = ctx
      this.position = position
      this.size = size
    }
    init(){
        this.update()
    }
    draw(){
        this.ctx.drawImage(obstacleImg,this.position.x,this.position.y,this.size.width,this.size.height)
    }
    update(){
        this.draw()
    }

}
class Bullet{
    constructor(ctx,position,speed,angle){
        this.ctx = ctx
        this.position = position
        this.speed = speed
        this.size = 5
        this.index;
        this.angle = angle
        this.distance = {
            x:0,
            y:0
        }
        this.travelDistance = 1000
    }
    init(index){
        this.index = index
        this.draw()
        this.update()
    }
    draw(){
        this.ctx.save()
        this.ctx.fillStyle = 'orange'
        this.ctx.translate(this.position.x+this.size/2,this.position.y+this.size/2)
        this.ctx.rotate(this.angle)
        this.ctx.translate(-this.position.x-this.size/2,-this.position.y-this.size/2)
        this.ctx.fillRect(this.position.x,this.position.y,this.size,this.size)
        this.ctx.strokeRect(this.position.x,this.position.y,this.size,this.size)
        this.ctx.restore()
    }
    update(){
        this.position.x += this.speed.x*10
        this.position.y += this.speed.y*10
        this.distance.x += Math.abs(this.speed.x*10)
        this.distance.y += Math.abs(this.speed.y*10)
        if (this.distance.x > this.travelDistance ||this.distance.y > this.travelDistance){
            bullets.splice(this.index,1)
        }
    }
}
class Enemy{
    constructor(ctx,position){
        this.ctx = ctx
        this.position = position
        this.velocity = {x:0,y:0}
        this.health = 20
        this.angle = 0
        this.size = 20
        this.knockback = {
          x:1,y:1
        }
        this.healthbar = false
        this.index;
        this.idle = false
    }
    init(index){
        this.index = index
        this.draw()
        this.update()
    }
    draw(){
       this.ctx.save()
       this.ctx.translate(this.position.x+this.size/2,this.position.y+this.size/2)
       this.ctx.rotate(this.angle)
       this.ctx.translate(-this.position.x-this.size/2,-this.position.y-this.size/2)
       this.ctx.drawImage(enemyimg,this.position.x,this.position.y,this.size,this.size)
       
       this.ctx.restore() 
       if (this.healthbar){
        this.ctx.beginPath()
        this.ctx.rect(this.position.x,this.position.y - 20,20,7)
        this.ctx.stroke()
        this.ctx.fillStyle = 'red'
        this.ctx.fillRect(this.position.x,this.position.y-20,this.health,7)
       }
    }
    update(){
        this.position.x += this.velocity.x
        this.position.y += this.velocity.y
        if (this.knockback.x < 1){
          this.knockback.x += 0.1
        }
        if (this.knockback.y < 1){
          this.knockback.y += 0.1
        }
        
    }
}
class Particle{
  constructor(ctx,position,speed){
    this.ctx = ctx
    this.position = position
   this.speed = speed
    this.size = Math.random()*4
    this.opacity = 1
    this.index;
  }
  init(index){
    this.index = index
    this.draw()
    this.update()
  }
  draw(){
    this.ctx.save()
    this.ctx.beginPath()
    this.ctx.fillStyle = 'rgba('+200+','+0+','+0+','+this.opacity+')'
    this.ctx.arc(this.position.x,this.position.y,this.size,0,Math.PI*2)
    this.ctx.fill()
    this.ctx.restore()
  }
  update(){
   this.position.x += this.speed.x
   this.position.y += this.speed.y
   this.opacity -= 0.02
   if (this.opacity <= 0){
    particles.splice(this.index,1)
   }
  }
}
players.push(new Player(ctx))
obstacles.push(new Obstacle(ctx,{width:200,height:200},{x:400,y:200}))
obstacles.push(new Obstacle(ctx,{width:200,height:200},{x:1000,y:200}))
obstacles.push(new Obstacle(ctx,{width:200,height:200},{x:700,y:1000}))
setInterval(()=>{
 if (enemies.length < enemyMax){
  if (Math.random() > 0.5){
  enemies.push(new Enemy(ctx,{x:Math.random()<0.5?-10:canvas.width+worldBorder.maxX,y:Math.random()*canvas.height+worldBorder.maxY}))}
  else {enemies.push(new Enemy(ctx,{x:Math.random()*canvas.width+worldBorder.maxX,y:Math.random()<0.5?canvas.height+worldBorder.maxY:-10}))}
}},1000)
setInterval(()=>{
   enemyMax++
},10000)
function timer(enemy){
  setTimeout(()=>{
    enemy.idle = false
  },5000)
}
function rotateAngle(event,player,rect){
    return Math.atan2(event.y*canvas.height/rect.bottom-player.position.y-player.size/2+camera.y+camera.mouse.y,event.x*canvas.width/rect.right-player.position.x-player.size/2+camera.x+camera.mouse.x)
}
function rotateEnemy(player,enemy){
    return Math.atan2(player.position.y-enemy.position.y,player.position.x-enemy.position.x)
}
function RectCollision(player,obstacle){
    if(
        player.position.x+player.size > obstacle.position.x &&(obstacle.position.x+obstacle.size.width) > player.position.x&&player.position.y+player.size > obstacle.position.y&&obstacle.position.y+obstacle.size.height > player.position.y){
        if (Math.min(Math.abs(player.position.x+player.size-obstacle.position.x),Math.abs(player.position.x-obstacle.position.x-obstacle.size.width))
          <Math.min(Math.abs(player.position.y+player.size-obstacle.position.y),Math.abs(player.position.y-obstacle.position.y-obstacle.size.height) 
        )){
          if (Math.abs(player.position.x + player.size - obstacle.position.x)>Math.abs(player.position.x - obstacle.position.x - obstacle.size.width)){
          player.position.x = obstacle.position.x + obstacle.size.width
         }
         else {player.position.x = obstacle.position.x - player.size}
        }
        else {
          if (Math.abs(player.position.y + player.size - obstacle.position.y)>Math.abs(player.position.y - obstacle.position.y - obstacle.size.height)){
            player.position.y = obstacle.position.y + obstacle.size.height
           }
           else {player.position.y = obstacle.position.y - player.size}
        }}
}
function PointRectCollision(point,rect){
    return point.position.x > rect.position.x &&point.position.x < rect.position.x + rect.size.width
     && point.position.y > rect.position.y &&point.position.y < rect.position.y + rect.size.height
}
function mouseCamera(event,rect){
    
    if (keys.shift.pressed && camera.mouse.multi < 90){
    camera.mouse.multi *= 1.4}
    else if (!keys.shift.pressed && camera.mouse.multi > 40) {
        camera.mouse.multi *= 0.9
    }
    camera.mouse.x = ((event.x*(canvas.width)/rect.right)/canvas.width-1/2)*camera.mouse.multi
    camera.mouse.y = ((event.y*(canvas.height)/rect.bottom)/canvas.height-1/2)*camera.mouse.multi
    if (camera.x+camera.mouse.x < 0)
    {camera.x = -camera.mouse.x}
   if (camera.y+camera.mouse.y < 0)
   {camera.y = -camera.mouse.y}
}
function LineCollision(x1,y1,x2,y2,x3,y3,x4,y4){
  uA = ((x4-x3)*(y1-y3) - (y4-y3)*(x1-x3)) / ((y4-y3)*(x2-x1) - (x4-x3)*(y2-y1)); 
  uB = ((x2-x1)*(y1-y3) - (y2-y1)*(x1-x3)) / ((y4-y3)*(x2-x1) - (x4-x3)*(y2-y1));
  if (uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1){return true}
  else return false
}
function Gameloop(){
    ctx.save()
    ctx.translate(-camera.x-camera.mouse.x,-camera.y-camera.mouse.y)

    var rect = canvas.getBoundingClientRect()
    for (var i = 0;i<=canvas.width+worldBorder.maxX+camera.x;i+=127){
     for (var j = 0;j<=canvas.height+worldBorder.maxY+camera.y;j+=127){
        ctx.drawImage(backgroundImg,i,j)
    }}
    bullets.forEach((bullet,index)=>{
      bullet.init(index)
      obstacles.forEach((obstacle)=>{
        if (PointRectCollision(bullet,obstacle)){
          bullets.splice(index,1)
        }
      })
      enemies.forEach((enemy,index2)=>{
        if (bullet.position.x > enemy.position.x &&bullet.position.x < enemy.position.x + enemy.size &&
          bullet.position.y > enemy.position.y &&bullet.position.y < enemy.position.y + enemy.size){
            bullets.splice(index,1)
            enemy.healthbar = true
            enemy.health -= 5
            enemy.knockback.x *= -1
            enemy.knockback.y *= -1
            if (enemy.health<=0){
              for (var i=0;i<8;i++){
                particles.push(new Particle(ctx,{x:enemy.position.x,y:enemy.position.y},{x:(Math.random()-0.5)*3,y:(Math.random()-0.5)*3}))
              }
              enemies.splice(index2,1)
            }
            
       }})
       })
    players.forEach((player,index)=>{
        player.init(rect)
        document.getElementById('mag').innerHTML = player.mag.bullet
        document.getElementById('health').innerHTML = player.health
        document.querySelector(':root').style.setProperty('--hpbar',player.health*5+'px')
        if (player.health <= 10){
          document.querySelector(':root').style.setProperty('--color','#fa6e02')
        }
        else {document.querySelector(':root').style.setProperty('--color','#44eb44')}
        obstacles.forEach((obstacle)=>{
          RectCollision(player,obstacle)
        })
        enemies.forEach((enemy)=>{
          if (player.position.x+player.size > enemy.position.x && enemy.position.x+enemy.size > player.position.x &&player.position.y+player.size > enemy.position.y
            && enemy.position.y+enemy.size > player.position.y && !player.invisiblity.bool){
                player.health -= 5
                player.healthbar = true
                player.knockback.x = enemy.velocity.x*10
                player.knockback.y = enemy.velocity.y*10
                
                player.invisiblity.bool = true
                if (player.healthbar){
                setTimeout(()=>{
                  player.healthbar = false
                },5000)}
                setTimeout(()=>{
                  player.invisiblity.bool = false
                },2000)
                var interval = setInterval(()=>{
                  if(player.invisiblity.bool){
                  player.invisiblity.blink = !player.invisiblity.blink}
                  else {clearInterval(interval),player.invisiblity.blink = false}
                },100)

                if (player.health <= 0){
                  document.getElementById('health').innerHTML = 0
                  document.querySelector(':root').style.setProperty('--color','#fa0f02')
                  document.querySelector(':root').style.setProperty('--hpbar',0+'px')
                  players.splice(index,1)
                  for (var i=0;i<8;i++){
                particles.push(new Particle(ctx,{x:player.position.x,y:player.position.y},{x:(Math.random()-0.5)*3,y:(Math.random()-0.5)*3}))
                }
                setTimeout(()=>{alert('You Died lmao');location.reload()},2000)          
                }
            }

                enemy.angle = rotateEnemy(player,enemy);
                enemy.velocity = {x:Math.cos(enemy.angle)*3*enemy.knockback.x,y:Math.sin(enemy.angle)*3*enemy.knockback.x}
            
        })
    })
    
    enemies.forEach((enemy,index)=>{
      enemy.init(index)
      enemies.forEach((enemy2)=>{
        if(
          enemy.position.x+enemy.size > enemy2.position.x &&(enemy2.position.x+enemy2.size) > enemy.position.x&&enemy.position.y+enemy.size > enemy2.position.y&&enemy2.position.y+enemy2.size > enemy.position.y && enemy != enemy2){
          if (Math.min(Math.abs(enemy.position.x+enemy.size-enemy2.position.x),Math.abs(enemy.position.x-enemy2.position.x-enemy2.size))
            <Math.min(Math.abs(enemy.position.y+enemy.size-enemy2.position.y),Math.abs(enemy.position.y-enemy2.position.y-enemy2.size) 
          )){
            if (Math.abs(enemy.position.x + enemy.size - enemy2.position.x)>Math.abs(enemy.position.x - enemy2.position.x - enemy2.size)){
              enemy.position.x = enemy2.position.x + enemy2.size
           }
           else {enemy.position.x = enemy2.position.x - enemy.size}
          }
          else {
            if (Math.abs(enemy.position.y + enemy.size - enemy2.position.y)>Math.abs(enemy.position.y - enemy2.position.y - enemy2.size)){
              enemy.position.y = enemy2.position.y + enemy2.size
             }
             else {enemy.position.y = enemy2.position.y - enemy.size}
          }}
      })
      
    })
    obstacles.forEach((obstacle)=>{
      obstacle.init()
      enemies.forEach((enemy)=>{
         RectCollision(enemy,obstacle)
      })
    })
    particles.forEach((particle,index)=>{
      particle.init(index)
     
    })

    frameCount++
    var elapsedTime = performance.now() - startTime;
    if (elapsedTime > 500) {
      fps = Math.round(frameCount / (elapsedTime / 1000))
      frameCount = 0;
      startTime = performance.now();
    }
    ctx.restore()
    requestAnimationFrame(Gameloop)
}

Gameloop()
addEventListener('keydown',({keyCode})=>{
    if (keyCode == 87) // W
    {keys.up.pressed = true}
    if (keyCode == 83) // S
      {keys.down.pressed = true}
    if (keyCode == 65) // A
      {keys.left.pressed = true}
    if (keyCode == 68) // D
     {keys.right.pressed = true}
    if (keyCode == 16){// shift
        keys.shift.pressed = true
       }
    if (keyCode == 82){//R
      keys.R.pressed = true
    }
})
addEventListener('keyup',({keyCode})=>{
    if (keyCode == 87) // W
    {keys.up.pressed = false}
    if (keyCode == 83) // S
      {keys.down.pressed = false}
    if (keyCode == 65) // A
      {keys.left.pressed = false}
    if (keyCode == 68) // D
     {keys.right.pressed = false}
    if (keyCode == 16){ // shift
        keys.shift.pressed = false
       }
    if (keyCode == 82){//R
        keys.R.pressed = false
      }
    
})
addEventListener('mousemove',(event)=>{
    players[0].event = event
  })
addEventListener('mousedown',(event)=>{
  keys.mouse1.pressed = true
}
)
addEventListener('mouseup',(event)=>{
  keys.mouse1.pressed = false
})