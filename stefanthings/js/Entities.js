//TODO: remove entire entity class and entire actor class
//TODO: move Maps to this file
var player;

//Entity - intial building block
Entity = function(type,id,x,y,spdX,spdY,width,height,img){
	var self = {
		type:type,
		id:id,
		x:x,
		y:y,
		spdX:spdX,
		spdY:spdY,
		width:width,
		height:height,
		img:img
	};
	
	//entity update method using updatePosition and draw
	self.update = function(){
		self.updatePosition();
		self.draw();
	}
	
	//draw onto the canvas
	self.draw = function(){	
		//offset from player
		var x = self.x - player.x;
		var y = self.y - player.y;
		//offset from center
		x += WIDTH/2;
		y += HEIGHT/2;
		//offset image width
		x -= self.width/2;
		y -= self.height/2;
		
		//actual draw of image
		ctx.drawImage(self.img, 0,0, self.img.width, self.img.height, x, y, self.width, self.height);
	}
	
	self.getDistance = function(entity2){   //return distance (number)
		var vx = self.x - entity2.x;
		var vy = self.y - entity2.y;
		return Math.sqrt(vx*vx+vy*vy);
	}

	self.testCollision = function(entity2){ //return if colliding (true/false)
		var rect1 = {
			x:self.x-self.width/2,
			y:self.y-self.height/2,
			width:self.width,
			height:self.height,
		}
		var rect2 = {
			x:entity2.x-entity2.width/2,
			y:entity2.y-entity2.height/2,
			width:entity2.width,
			height:entity2.height,
		}
		return testCollisionRectRect(rect1,rect2);
		   
	}
	
	//update the position math only
	self.updatePosition = function(){
		self.x += self.spdX;
		self.y += self.spdY;
					   
		if(self.x < 0 + Maps.current.fluff + self.width/2 || self.x > Maps.current.width - Maps.current.fluff - self.width/2){
			self.spdX = -self.spdX;
		}
		if(self.y < 0 + Maps.current.fluff + self.height/2 || self.y > Maps.current.height - Maps.current.fluff + self.height/2){
			self.spdY = -self.spdY;
		}
	}
	
	//out of bounds check
	self.validatePosition = function(){		
		if(self.x < self.width/2 + Maps.current.fluff)
			self.x = self.width/2 + Maps.current.fluff;
		if(self.x > Maps.current.width - self.width/2 - Maps.current.fluff)
			self.x = Maps.current.width - self.width/2 - Maps.current.fluff;
		if(self.y < self.height/2 + Maps.current.fluff)
			self.y = self.height/2 + Maps.current.fluff;
		if(self.y > Maps.current.height - self.height/2 - Maps.current.fluff)
			self.y = Maps.current.height - self.height/2 - Maps.current.fluff;
	}
   
	return self;
}

//Actor - uses Entity to make Player and Enemies
Actor = function(type,id,x,y,spdX,spdY,width,height,img,hp,atkSpd){
	var self = Entity(type,id,x,y,spdX,spdY,width,height,img);
   
	self.hp = hp;
	self.hpMax = hp;
	self.atkSpd = atkSpd;
	self.attackCounter = 0;
	self.aimAngle = 0;
	self.spriteAttacking = false;
	self.attackType = 0;
	
	//update the Entity using additional update Actor
	var super_update = self.update;
	self.update = function(){
		super_update();
		self.attackCounter += self.atkSpd;
		if (self.hp <= 0)
			self.onDeath();
	}
	self.onDeath = function(){};
	self.performAttack = function(){
		if(self.attackCounter > 25){    //every 1 sec
			self.attackCounter = 0;
			self.spriteAttacking = true;
			self.attackType = 0;
			Bullet.generate(self, self.aimAngle);
		}
	}
   
	self.performSpecialAttack = function(){
		if(self.attackCounter > 50){    //every 1 sec
			self.attackCounter = 0;
			self.spriteAttacking = true;
			self.attackType = 1;
			/*
			for(var i = 0 ; i < 360; i++){
					Bullet.generate(self,i);
			}
			*/
			Bullet.generate(self,self.aimAngle - 5);
			Bullet.generate(self,self.aimAngle);
			Bullet.generate(self,self.aimAngle + 5);
		}
	}
	
	//draw actor hp bars
	var super_draw = self.draw;
	self.draw = function(){
		super_draw();
		
		//offset from player, center, and image height
		var x = self.x - player.x + WIDTH/2;
		var y = self.y - player.y + HEIGHT/2 - self.height/2 - 20;
		
		//hp bar
		ctx.save();
		ctx.fillStyle = 'red';
		var width = 50*self.hp/self.hpMax;
		if(width < 0)
			width = 0;
		ctx.fillRect(x-25,y,width,5);
		ctx.strokeStyle = 'black';
		ctx.strokeRect(x-25,y,50,5);
		ctx.restore(); 	
	}

	return self;
}

//Player - uses Actor
Player = function(){
	//				 type    ,id    ,x  ,y  ,spdX,spdY,width50,height70,img,hp,atkSpd
	var self = Actor('player','myId',500,500,   0,   0,64,64,Img.paladin,10,2);
	
	

	
	self.updateSpd = function(){
		if(self.pressingRight)
			self.spdX = 10;
		else if(self.pressingLeft)
			self.spdX = -10;
		else
			self.spdX = 0;
		
		if(self.pressingUp)
			self.spdY = -10;
		else if(self.pressingDown)
			self.spdY = 10;
		else
			self.spdY = 0;
		
	}
	
	//update the Entity using additional update Player
	var super_update = self.update;
	self.update = function(){
		self.updateSpd();
		super_update();
		self.validatePosition();
		self.spriteAnimCounter += 0.5;
		if(self.spriteAttacking){
			self.spriteAttackingCounter +=1;
			if(self.spriteAttackingCounter % 6 === 0)
				self.spriteAttacking = false;
		}
		if(self.pressingMouseLeft)
			player.performAttack();
		if(self.pressingMouseRight)
			player.performSpecialAttack();
		
		/*
		if(self.pressingRight || self.pressingLeft)
			self.spdX = 10;
		else
			self.spdX = 0;
		if(self.pressingUp || self.pressingDown)
			self.spdY = 10;
		else
			self.spdY = 0;*/
		console.log("spdX: " + self.spdX + ", spdY: " + self.spdY);
	}
	
	self.spriteAnimCounter = 0;
	self.spriteAttackingCounter = 0;
	
	//draw player sprite
	self.draw = function(){	
		
		//Entity draw
		//offset from player
		var x = self.x - player.x;
		var y = self.y - player.y;
		//offset from center
		x += WIDTH/2;
		y += HEIGHT/2;
		//offset image width
		x -= self.width/2;
		y -= self.height/2;
		
		//image dimensions
		var frameWidth = 64;
		var frameHeight = 64;
		
		//image direction
		var aimAngle = self.aimAngle;
		if (aimAngle < 0)
			aimAngle += 360;
		var directionMod = 3; //right
		if(aimAngle >= 45 && aimAngle < 135)
			directionMod = 2; //down
		if(aimAngle >= 135 && aimAngle < 225)
			directionMod = 1; //left
		if(aimAngle >= 225 && aimAngle < 315)
			directionMod = 0; //up
		
		//image animation loop
		var walkingMod = Math.floor(self.spriteAnimCounter) % 7;
		var attackingMod = Math.floor(self.spriteAttackingCounter) % 6;
		
		//TODO:export this entire function in Actor
		//actual draw of image
		//draw attack1
		if (self.spriteAttacking && self.attackType == 0)
			ctx.drawImage(self.img, attackingMod*frameWidth, directionMod*frameHeight+frameHeight*12, frameWidth, frameHeight, x, y, self.width, self.height);
		//draw attack2
		else if (self.spriteAttacking && self.attackType == 1)
			ctx.drawImage(self.img, attackingMod*frameWidth*3, directionMod*frameHeight*3+frameHeight*21, frameWidth*3, frameHeight*3, x-frameWidth, y-frameHeight, self.width*3, self.height*3);
		//draw walk
		else if (self.spdX == 0 && self.spdY == 0)
			ctx.drawImage(self.img, 0, directionMod*frameHeight+frameHeight*8, frameWidth, frameHeight, x, y, self.width, self.height);	
		//draw standing
		else
			ctx.drawImage(self.img, walkingMod*frameWidth+frameWidth, directionMod*frameHeight+frameHeight*8, frameWidth, frameHeight, x, y, self.width, self.height);
		
		//Actor draw
		//offset from player, center, and image height
		x = self.x - player.x + WIDTH/2;
		y = self.y - player.y + HEIGHT/2 - self.height/2 - 20;
		
		//hp bar
		ctx.save();
		ctx.fillStyle = 'red';
		var width = 50*self.hp/self.hpMax;
		if(width < 0)
			width = 0;
		ctx.fillRect(x-25,y,width,5);
		ctx.strokeStyle = 'black';
		ctx.strokeRect(x-25,y,50,5);
		ctx.restore(); 	
	}
	
	self.onDeath = function(){
		var timeSurvived = Date.now() - timeWhenGameStarted;           
		//sessionStorage.setItem("score", score);
		console.log("You lost! You survived for " + timeSurvived + " ms.");            
		//window.location.href = "gameover.html";
		/*
		if (highscore < score ) {
			console.log("New high score!");
			highscore = score;
		}
		
		document.getElementById("highscore").innerHTML = highscore;
		*/
		startNewGame();
	}
	
	self.pressingDown = false;
	self.pressingUp = false;
	self.pressingLeft = false;
	self.pressingRight = false;
	self.pressingMouseLeft = false;
	self.pressingMouseRight = false;
	return self;    
}

//////////////////////////////////////////////////////////////
//Enemy - uses Actor
Enemy = function(id,x,y,spdX,spdY,width,height,img,hp,atkSpd){
	var self = Actor('enemy',id,x,y,spdX,spdY,width,height,img,hp,atkSpd);
	
	//overwrite of enemy aim angle of 0 
	self.updateAim = function () {
		var diffX = player.x - self.x;
		var diffY = player.y - self.y;
		
		self.aimAngle = Math.atan2(diffY,diffX) / Math.PI * 180
	}
	
	//*/overwrite enemy bounces to just follow player
	self.updatePosition = function(){
		var diffX = player.x - self.x;
		var diffY = player.y - self.y;
		
		if (diffX > 3)
			self.x += 3;
		else if (diffX < -3)
			self.x -= 3;
		
		if (diffY > 3)
			self.y += 3;
		else if (diffY < -3)
			self.y -= 3;
	}
	//*/
	self.toRemove = false;
	
	self.onDeath = function(){
		self.toRemove = true;
		//TODO:delete Enemy.list[key];
	}
	
	//update the Actor using additional update Enemy
	var super_update = self.update;
	self.update = function () {
		super_update();
		self.updateAim();
		self.performAttack(); //peforms the enemy attack
	
		/*player lose hp on touching enemy - this can be commented out if enemies perform attacks so that only their attacks hit																												
		var isColliding = player.testCollision(self);
		if(isColliding){
				player.hp = player.hp - 1;
		}
		//*/
		if(self.toRemove){
			delete Enemy.list[self.id];
		}
	}
	Enemy.list[id] = self;
}

Enemy.list = {};

Enemy.update = function(){
	//generate enemies
	if(frameCount % 80 === 0)      //every 1 sec
		Enemy.randomlyGenerate();
	//refresh enemies
	for(var key in Enemy.list){
		Enemy.list[key].update();
	}
}
	
Enemy.randomlyGenerate = function(){
	//adding fluff and generating in the correct area, sidenote: Math.random() returns a number between 0 and 1
	var x = Math.random()*(Maps.current.width-2*Maps.current.fluff)+Maps.current.fluff;
	var y = Math.random()*(Maps.current.height-2*Maps.current.fluff)+Maps.current.fluff;
	var height = 50; //64
	var width = 23; //64
	//var height = 10 + Math.random()*30;     //between 10 and 40
	//var width = 10 + Math.random()*30;
	var id = Math.random();
	var spdX = 5 + Math.random() * 5;
	var spdY = 5 + Math.random() * 5;
	if (Math.random() < 0.5)
		Enemy(id,x,y,spdX,spdY,width,height,Img.enemy,2,1);
	else
		Enemy(id,x,y,spdX,spdY,width,height,Img.enemyTwo,1,2);
}

////////////////////////////////////////////////////////////////
//Upgrade - uses Entity
Upgrade = function (id,x,y,spdX,spdY,width,height,category,img){
	var self = Entity('upgrade',id,x,y,spdX,spdY,width,height,img);
	
	var super_update = self.update;
	self.update = function(){
		super_update();
		var isColliding = player.testCollision(self);
		if(isColliding){
			if(self.category === 'score')
				score += 1000;
			if(self.category === 'atkSpd')
				player.atkSpd += 3;
			delete Upgrade.list[self.id];
		}
	}
	
	self.category = category;
	Upgrade.list[id] = self;
}

Upgrade.list = {};
 
Upgrade.update = function(){
	/*/generate upgrades
	if(frameCount % 75 === 0)       //every 3 sec
		Upgrade.randomlyGenerate();
	//*/
	//refresh upgrades
	for(var key in Upgrade.list){
		Upgrade.list[key].update();
	}
}

Upgrade.randomlyGenerate = function(){
	//Math.random() returns a number between 0 and 1
	var x = Math.random()*Maps.current.width;
	var y = Math.random()*Maps.current.height;
	var height = 10;
	var width = 10;
	var id = Math.random();
	var spdX = 0;
	var spdY = 0;
   
	if(Math.random() < 0.5){
		var category = 'score';
		var img = Img.upgrade1;
	} else {
		var category = 'atkSpd';
		var img = Img.upgrade2;
	}
   
	Upgrade(id,x,y,spdX,spdY,width,height,category,img);
}

//////////////////////////////////////////////////////////////
//Bullet - uses Entity
Bullet = function (id,x,y,spdX,spdY,width,height, combatType){
	var self = Entity('bullet',id,x,y,spdX,spdY,width,height,Img.bullet);
   
	self.timer = 0;
	self.combatType = combatType;
	//self.spdX = spdX; not needed as spdX is in Entity
	//self.spdY = spdY; not needed as spdX is in Entity
	
	//update the Entity using additional update Bullet 
	var super_update = self.update;
	self.update = function () {
		super_update();
		var toRemove = false; //TODO: change to self.toRemove
		self.timer++;
		if(self.timer > 75){
			toRemove = true;
		}
		
		//bullet collision
		if (self.combatType == 'player') { //bullet was shot by player - delete enemies																				  
			for(var key in Enemy.list){
				if(self.testCollision(Enemy.list[key])){
					toRemove = true;
					Enemy.list[key].hp -= 1;
					//TODO:delete Enemy.list[key];
					//break;
				}      			
			}
		} else if (self.combatType == 'enemy') { //bullet was shot by enemy	- delete player hp
			if(self.testCollision(player)){
				toRemove = true;
				player.hp -= 1;
			}
		}
		if(toRemove){
			delete Bullet.list[self.id];
		}
	}
	
	Bullet.list[id] = self;
}

Bullet.list = {};

Bullet.update = function(){
	//refresh bullets
	for(var key in Bullet.list){
		Bullet.list[key].update(); 
	}	
}
	
Bullet.generate = function(actor,aimOverwrite){ //aimOverwrite should be used most often, however for now it is always used
	//Math.random() returns a number between 0 and 1
	var x = actor.x;
	var y = actor.y;
	var height = 25; //32
	var width = 25; //32
	var id = Math.random();
   
	var angle;
	if(aimOverwrite !== undefined)
		angle = aimOverwrite;
	else angle = actor.aimAngle;
   
	var spdX = Math.cos(angle/180*Math.PI)*20;
	var spdY = Math.sin(angle/180*Math.PI)*20;
	Bullet(id,x,y,spdX,spdY,width,height,actor.type);
}
 