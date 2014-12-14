var fs = require('fs'),
	util = require('util'),
	path = require('path'),	
	azure = require('azure-storage');

module.exports = function(grunt) {

	var keys = grunt.file.readJSON('./keys.json'),
		modpack = grunt.file.readJSON('./modpack.json');

	var modFolder = 'mods',
		configFolder = 'config',
		binariesFolder = 'binaries',
		buildFolder = 'build';

	var blobService = azure.createBlobService(keys.accountName, keys.accessKey);

	
	grunt.registerTask('init', function() {		
		
	});

	grunt.registerTask('getMods', function() {			
		grunt.file.mkdir(modFolder);
		grunt.log.writeln('Found %d mods', modpack.mods.length);
		grunt.task.run(modpack.mods.map(function(m) { return util.format('downloadFile:%s:%s',modFolder, m); }));		
	});

	grunt.registerTask('getBinaries', function() {
		grunt.file.mkdir(binariesFolder);
		grunt.task.run(util.format('downloadFile:%s:%s', binariesFolder, modpack.client.bin));
		grunt.task.run(util.format('downloadFile:%s:%s', binariesFolder, modpack.server.bin));
	});

	grunt.registerTask('downloadFile', function(folder, filename) {
		var done = this.async();
		var filePath = path.resolve(path.join(folder, filename));

		if(fs.existsSync(filePath)) {
			grunt.log.writeln('Found %s', filename);
			done();
		} else {		
			var downloadTask = grunt.log.writeln('Downloading %s', filePath);
			var stream = fs.createWriteStream(filePath);
			blobService.getBlobToStream(folder, filename, stream, function(error, result, response){
			  	if(!error) {			  		
			    	downloadTask.ok();
			  	} else {			  		
			  		downloadTask.error(error);
			  		stream.close();
			  		fs.unlinkSync(filePath);			  		
			  	}
			  	done();
			});
		}
	});

	grunt.registerTask('clean', function() {		
		grunt.file.delete(buildFolder);		
	});

	grunt.registerTask('buildClient', function() {		
		var clientBuildFolder = path.join(buildFolder, 'client');

		var sourceBinPath = path.join(binariesFolder, modpack.client.bin);
		var targetBinPath = path.join(clientBuildFolder, 'bin', 'modpack.jar');
		grunt.file.copy(sourceBinPath, targetBinPath);

		// Copy mods
		grunt.file.recurse(modFolder, function(abspath, rootdir, subdir, filename) {			
			grunt.file.copy(abspath, path.join(clientBuildFolder, modFolder, subdir || '', filename));
		});

		// Copy config
		grunt.file.recurse(configFolder, function(abspath, rootdir, subdir, filename) {			
			grunt.file.copy(abspath, path.join(clientBuildFolder, configFolder, subdir || '', filename));
		});
	});

	grunt.registerTask('buildServer', function() {
		var serverBuildFolder = path.join(buildFolder, 'server');
		grunt.file.mkdir(serverBuildFolder);
	});

	grunt.registerTask('getDeps', ['getBinaries', 'getMods']);
	grunt.registerTask('build', ['buildClient', 'buildServer']);
	grunt.registerTask('default', ['init', 'getDeps', 'build']);	
		  
};