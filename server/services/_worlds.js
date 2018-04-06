const fs = require('fs');
const exec = require('child_process').exec;

const Log = require(process.env.DIST ? `${__dirname}/../_log` : `${__dirname}/../../../swiss-army-knife/js/_log`);

function browse(folder, cb){
	var folders = [];

	exec('ls -d "'+ folder +'"/*/', function(err, stdout, stderr){
		var folderNames = stdout.split('\n');

		folderNames.forEach(function(folderName){
			if(folderName && folderName.length) folders.push(/\/([^\/]*?)\/$/.exec(folderName)[1]);
		});

		var files = [];

		exec('ls -p "'+ folder +'/" | grep -v /', function(err, stdout, stderr){
			var fileNames = stdout.split('\n');

			fileNames.forEach(function(fileName){
				if(fileName && fileName.length) files.push(fileName);
			});

			cb({ folder: folder, folders: folders, files: files });
		});
	});
}

const Worlds = {
	packs: {},
	init: function(){
		browse(`${__dirname}/../worlds`, function(data){
			Log()(`Loading ${data.files.length} packs`);

			data.files.forEach(function(file){
				fs.readFile(data.folder +'/'+ file, function(err, data){
					var packData = JSON.parse(data), packName = file.replace('.json', '');

					Worlds.packs[packName] = packData;

					Log()(`Loaded ${packName}`);
				});
			});
		});
	},
	get: function(packNames){
		var packCount = packNames.length, output = [];

		for(var x = 0; x < packCount; ++x){
			output = output.concat(Worlds.packs[packNames[x]]);
		}

		return output;
	}
};

module.exports = Worlds;