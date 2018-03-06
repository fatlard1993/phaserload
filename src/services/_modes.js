const fs = require('fs');
const exec = require('child_process').exec;
const Log = require(process.env.DIR +'/_log.js');

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

const Modes = {
	list: {},
	init: function(){
		browse(process.env.DIR +'/../src/modes', function(data){
			Log()(`Loading ${data.files.length} packs`);

			data.files.forEach(function(file){
				fs.readFile(data.folder +'/'+ file, function(err, data){
					var packData = JSON.parse(data), packName = file.replace('.json', '');

					Modes.list[packName] = packData;

					Log()(`Loaded ${packName}`);
				});
			});
		});
	}
};

module.exports = Modes;