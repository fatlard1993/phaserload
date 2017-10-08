/* global Phaser, Game */

Game.entities.itemSlot = function(game){};

Game.entities.itemSlot.create = function(x, y){
  var itemSlot =  Game.game.add.sprite(x, y, 'itemSlot', 2);

  itemSlot.anchor.setTo(0.5, 0.5);
  
  itemSlot.fixedToCamera = true;
  
  itemSlot.frame = 0;
  itemSlot.item = '';

  return itemSlot;
};

Game.entities.itemSlot.setItem = function(slotNum, item){
  Game['itemSlot'+ slotNum].item = item;

  Game['itemSlot'+ slotNum].frame = item === '' ? 0 : 1;

  if(item === ''){
    if(Game['itemSlot'+ slotNum].itemSprite) Game['itemSlot'+ slotNum].itemSprite.destroy();
  }
  else{
    var frame = 0;

    Game['itemSlot'+ slotNum].itemSprite = Game.game.add.sprite(0, 0, item.includes('charge') ? 'explosive' : item);
    Game['itemSlot'+ slotNum].itemSprite.anchor.setTo(0.5, 0.5);
  
    Game['itemSlot'+ slotNum].addChild(Game['itemSlot'+ slotNum].itemSprite);

    if(item.includes('charge')){
      if(item.includes('freeze')) frame += 4;
      if(item.includes('remote')) frame += 2;
    }
    else if(item === 'detonator'){
      Game['itemSlot'+ slotNum].itemSprite.animations.add('use', [1, 2, 3], 3, false);
    }

    Game['itemSlot'+ slotNum].itemSprite.frame = frame;
  }
};