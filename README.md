# Doodle Jump - Game Boy Edition

A web-based implementation of the classic Doodle Jump game, styled as a Game Boy game. Jump as high as you can while avoiding falling!

![Game Screenshot](./screenshot.png)

## Sponsoring

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/stvlynn)

[![](https://img.shields.io/static/v1?label=Sponsor&message=%E2%9D%A4&logo=GitHub&color=%23fe8e86)](https://github.com/sponsors/stvlynn)

## Play Online

[Doodle Jump - Game Boy Edition](https://doodle.twi.am)

## Game Instructions

Doodle Jump is a vertical scrolling platform game where you control a character that automatically jumps whenever it lands on a platform. Your goal is to climb as high as possible without falling or hitting obstacles.

### Game Features

- **Dynamic Difficulty**: The game gets progressively harder as your score increases
- **Platform Types**: 
  - Normal (solid green)
  - Moving (blue platforms that move horizontally)
  - Breakable (yellow platforms that break after one use)
  - Spring (platforms with springs that give extra jump height)
- **Power-ups**: Collect rockets to boost high into the sky
- **Game Boy Style**: Authentic Game Boy appearance with D-pad and button controls

## Controls

### Keyboard Controls

- **Left/Right Arrow Keys**: Move left or right
- **A Key or Enter**: Start game / Confirm selection in menus
- **B Key**: Return to game from settings
- **Escape Key**: Open settings menu

### Game Boy Controls

- **D-pad**: Move left/right during gameplay, navigate in menus
- **A Button**: Start game / Confirm selection
- **B Button**: Return to game from settings
- **START Button**: Start the game
- **SELECT Button**: Open settings menu

### Settings

Access the settings menu by pressing the SELECT button or ESC key. Options include:
- Gravity Control: Use device tilt to control movement (mobile devices only)
- Fullscreen Mode: Toggle fullscreen display
- Author information

## How It Works

The game uses Next.js with React for the frontend and implements the game loop using React hooks. The difficulty system dynamically adjusts platform generation, power-up frequency, and other game mechanics based on your score.

## Technology Stack

- [Next.js](https://nextjs.org/)
- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)

## Getting Started

First, clone the repository and install dependencies:

```bash
git clone https://github.com/stvlynn/doodle-jump-shadcn.git
cd doodle-jump-shadcn
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to play the game.


## Author

[Steven Lynn](https://github.com/stvlynn)

## License

[AGPL-3.0](./LICENSE)
