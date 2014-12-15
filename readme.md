== How to source control a Minecraft modpack: An example ==

=== Building ===

1. Install node.js if you haven't already
2. After cloning the repository, download the dependencies by running `npm install`
3. Edit modpack.json to specify the name of your modpack, mods, and client and server binaries (its assumed the server binary is a zip containing the forge/cauldron/etc jar, the libraries it depends on and the minecraft server jar)
4. You'll need to manually add a `keys.json` file that provides an azure storage account name and key which will be used to resolve all binaries and mods

e.g. 

	{
		"accountName": "mystorageaccount",	
		"accessKey": "ASDF"
	}

5. From the command line, run `grunt`.
6. If the build is successful, you'll end up with a build folder that contains a client folder, server folder, and a zip. The zip is a technic platform modpack that you can upload somewhere and link your pack to via the technic platform website. The server folder should be ready to run as a local server. To run the client, use the Minecraft Forge installer (instructions [here](http://www.minecraftforge.net/wiki/Installation/Universal)) to setup your standard minecraft launcher to run forge. After the setup is complete, edit your forge profile in the minecraft launcher to point to the client directory.
