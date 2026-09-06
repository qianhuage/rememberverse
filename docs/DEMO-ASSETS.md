# Prepared demo assets

The living island uses the bundled Mint model `ks781wrv2pwf7fxpxjjb8bed258dwb6s` (Cherry Blossom Skyhaven). It is a textured polygonal GLB, with interactive navigation and real-time effects added in Three.js.

The demo companion is based on the user's supplied golden dog photograph. A standing reference was prepared with OpenAI image generation, then converted to a textured model with Mint (`ks7cpe14epvh14d44ex3gyjjh58dw70y`). Its walk, run, head movement, breathing and tail motion use a custom quadruped deformation rig in Three.js. This is a demo interpretation of the dog, not a production motion-capture or exact reconstruction service. A separately articulated procedural dog provides a loading fallback.

The resting dog GLB is Mint model `ks70evr84adehnc80w6jdw78js8dwgdp`, generated directly from the original photo. The Dream world uses this resting model.

Dream world: World Labs Marble 1.1, world `1a4fdef0-58e7-4922-a308-9282b81e768d`. Its 500k SPZ is bundled locally. The dream scene and living scene are separate views.

These are real generated assets, prepared before the demo. Tripo generation returned insufficient credits (code 2010); no Tripo-generated asset is claimed. Convex bridge source is included but no deployment was configured.

## Presenting the living dog

Open the sample island. The dog roams automatically. Click a meadow destination to guide it, use WASD or arrow keys to walk, and hold Shift to run. Choose Follow for a camera that follows the dog. Drag in Island view to orbit; scroll to zoom. The portrait shows the original reference photo.
