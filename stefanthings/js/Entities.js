var player;
var enemyList = {};
var upgradeList = {};
var bulletList = {};
//TODO: remove entire entity class and entire actor class

Player = function(){
		//				 type    ,id    ,x  ,y  ,spdX,spdY,width50,height70,img,hp,atkSpd
		var self = Actor('player','myId',250,250,1000,1000,23,50,Img.player,10,1);
       
        self.updatePosition = function(){
                if(self.pressingRight)
                        self.x += 10;
                if(self.pressingLeft)
                        self.x -= 10;  
                if(self.pressingDown)
                        self.y += 10;  
                if(self.pressingUp)
                        self.y -= 10;  
				
                //TODO: ispositionvalid - this is similar to flipping the speed for entity, it can be removed if player speed is used
                if(self.x < self.width/2 + currentMap.fluff)
                        self.x = self.width/2 + currentMap.fluff;
                if(self.x > currentMap.width - self.width/2 - currentMap.fluff)
                        self.x = currentMap.width - self.width/2 - currentMap.fluff;
                if(self.y < self.height/2 + currentMap.fluff)
                        self.y = self.height/2 + currentMap.fluff;
                if(self.y > currentMap.height - self.height/2 - currentMap.fluff)
                        self.y = currentMap.height - self.height/2 - currentMap.fluff;
        }
		
		//update the Entity using additional update Player
		var super_update = self.update;
        self.update = function(){
            super_update();
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
        return self;
       
}
 
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
                img:img,
        };
		
		//entity update method using updatePosition and draw
        self.update = function(){
                self.updatePosition();
                self.draw();
        }
		//draw onto the canvas
        self.draw = function(){
                ctx.save(); // filler
                
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
				
                ctx.restore(); //filler
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
		//update the position math only (this is missing taking into account the height/width of entity)
        self.updatePosition = function(){
                self.x += self.spdX;
                self.y += self.spdY;
                               
                if(self.x < 0 + currentMap.fluff || self.x > currentMap.width - currentMap.fluff){
                        self.spdX = -self.spdX;
                }
                if(self.y < 0 + currentMap.fluff || self.y > currentMap.height - currentMap.fluff){
                        self.spdY = -self.spdY;
                }
        }
       
        return self;
}
 
Actor = function(type,id,x,y,spdX,spdY,width,height,img,hp,atkSpd){
        var self = Entity(type,id,x,y,spdX,spdY,width,height,img);
       
        self.hp = hp;
        self.atkSpd = atkSpd;
        self.attackCounter = 0;
        self.aimAngle = 0;
		
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
                        generateBullet(self, self.aimAngle);
                }
        }
       
        self.performSpecialAttack = function(){
                if(self.attackCounter > 50){    //every 1 sec
                        self.attackCounter = 0;
                        /*
                        for(var i = 0 ; i < 360; i++){
                                generateBullet(self,i);
                        }
                        */
                        generateBullet(self,self.aimAngle - 5);
                        generateBullet(self,self.aimAngle);
                        generateBullet(self,self.aimAngle + 5);
                }
        }
 
       
        return self;
}
 
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
			//TODO:delete enemyList[key];
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
                delete enemyList[self.id];
            }
		}
		enemyList[id] = self;
}
 
randomlyGenerateEnemy = function(){
        //adding fluff and generating in the correct area, sidenote: Math.random() returns a number between 0 and 1
        var x = Math.random()*(currentMap.width-2*currentMap.fluff)+currentMap.fluff;
        var y = Math.random()*(currentMap.height-2*currentMap.fluff)+currentMap.fluff;
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
			Enemy(id,x,y,spdX,spdY,width,height,Img.enemyTwo,1,3);
}
 
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
                delete upgradeList[self.id];
            }
		}
		
        self.category = category;
        upgradeList[id] = self;
}
 
randomlyGenerateUpgrade = function(){
        //Math.random() returns a number between 0 and 1
        var x = Math.random()*currentMap.width;
        var y = Math.random()*currentMap.height;
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
				for(var key in enemyList){
					if(self.testCollision(enemyList[key])){
							toRemove = true;
							enemyList[key].hp -= 1;
							//TODO:delete enemyList[key];
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
                delete bulletList[self.id];
            }
		}
		
        bulletList[id] = self;
}
 
generateBullet = function(actor,aimOverwrite){ //aimOverwrite should be used most often, however for now it is always used
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
       
        var spdX = Math.cos(angle/180*Math.PI)*5;
        var spdY = Math.sin(angle/180*Math.PI)*5;
        Bullet(id,x,y,spdX,spdY,width,height,actor.type);
}
 