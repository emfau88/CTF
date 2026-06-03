import Phaser from "phaser";
import "./styles.css";
import { ArenaScene } from "./scenes/ArenaScene";

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  backgroundColor: "#edf5ee",
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: window.innerWidth,
    height: window.innerHeight,
  },
  render: { antialias: true },
  scene: [ArenaScene],
});
