var fs = require('fs'),
	util = require('util'),
	path = require('path'),	
	azure = require('azure-storage');

module.exports = function(grunt) {

	var keys = grunt.file.readJSON('./keys.json'),
		modpack = grunt.file.readJSON('./modpack.json'),
		package = grunt.file.readJSON('./package.json');

	var modFolder = 'mods',
		configFolder = 'config',
		binariesFolder = 'binaries';

	var blobService = azure.createBlobService(keys.accountName, keys.accessKey);

	grunt.initConfig({		
		zip: {
			'client': {
				cwd: 'build/client',
				src: grunt.file.expand(['build/client/bin/**', 'build/client/mods/**', 'build/client/config/**']),
		  		dest: util.format('build/StoneToCode-%s.zip', package.version)
			}
		},
		unzip: {
			'server-bin': {
				src: path.join(binariesFolder, modpack.server.bin),
				dest: 'build/server'
			}
		},
		copy: {
			'client': {
				files: [ 
					{ 
						src: path.join(binariesFolder, modpack.client.bin), 
						dest: 'build/client/bin/modpack.jar'
					},
					{ 
						expand: true,
						src: ['mods/**', 'config/**'], 
						dest: 'build/client'
					}					
				]
			},			
			'server': {
				files: [ 
					{ 
						expand: true,
						src: ['mods/**', 'config/**'], 
						dest: 'build/server'
					},
					{ 
						expand: true,
						src: ['server/**'], 
						dest: 'build'
					}	
				]
			},
		}
	});	
	
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
		grunt.file.delete('build');
	});

	grunt.registerTask('getDeps', ['getBinaries', 'getMods']);
	grunt.registerTask('buildServer', ['unzip:server-bin', 'copy:server']);
	grunt.registerTask('buildClient', ['copy:client', 'zip:client']);
	grunt.registerTask('build', ['buildClient', 'buildServer']);
	grunt.registerTask('default', ['init', 'getDeps', 'build']);	
		  
  	grunt.loadNpmTasks('grunt-zip');
  	grunt.loadNpmTasks('grunt-contrib-copy');
};