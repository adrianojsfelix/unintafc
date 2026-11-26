# Prompts prontos para o Gemini

Gerado por `tools/build_prompt_guide.py` (versão visual: `docs/prompts_gemini.html`).

**Como usar:** no Gemini, escolha criar imagem, anexe a foto do grupo (`assets/reference/elenco.jpg`) e, se quiser, também o recorte individual da pessoa (`assets/reference/elenco/`). Cole o prompt do personagem e envie.

## Gaby

Fundo: **magenta** · referência: `assets/reference/elenco/1_gaby.png` · salvar como `assets/reference/gaby_sprites_raw.png`

```
Using the attached group photo as reference, create a 16-bit pixel art SPRITE SHEET of the 1st person from the LEFT, as a character for a 1990s Super Nintendo street fighting game.
Keep the same face, hair, beard, body type and clothes as in the photo.

Character: Gaby
Look: long light-brown hair, black polo shirt with white "UFS" letters and red sleeve cuffs, black wide-leg pants, sandals, bracelet.
Fighting style: Carries a small BLACK CAT on the shoulder or in the arms. Fights mostly with KICKS, uses the cat as a weapon and has FIRE powers.

SHEET RULES (very important):
- Solid flat MAGENTA background (#FF00FF) filling the entire image. No gradient, no checkerboard, no floor, no ground shadow.
- Do not use pink, magenta or purple anywhere on the character or the effects.
- Every frame shows the full body, facing RIGHT, same size and scale in all frames.
- In each row, the feet stay on the same baseline.
- Leave clear empty space between frames: frames must NEVER touch or overlap.
- One animation per row, frames from left to right:
Row 1 - fighting stance idle, cat on the shoulder, 6 frames (breathing loop)
Row 2 - walking forward, 8 frames
Row 3 - jump: crouch, rise, spinning tuck in the air, land (5 frames)
Row 4 - blocking pose (1 frame) and crouching (1 frame)
Row 5 - fast high kick, 5 frames; then a spinning roundhouse kick, 5 frames
Row 6 - FIREBALL: pulls both hands back, flames gather, pushes palms forward releasing a fireball (7 frames)
Row 7 - the fireball alone flying (4 frames) + fire impact explosion (3 frames)
Row 8 - CAT ATTACK: lifts the black cat and throws it forward (6 frames)
Row 9 - the black cat alone running and leaping to scratch (6 frames)
Row 10 - getting hit (2 frames), knocked back, falling and lying on the floor (6 frames)
Row 11 - victory pose hugging the cat, 4 frames
Row 12 - burning K.O.: engulfed in flames, getting charred, 7 frames, last frame a pile of fire
- No text, no labels, no numbers, no grid lines, no borders.
- Crisp pixel art with dark outlines and a limited palette, like classic SNES fighting game sprites.
```

## Adriano

Fundo: **magenta** · referência: `assets/reference/elenco/2_adriano.png` · salvar como `assets/reference/adriano_sprites_raw.png`

```
Using the attached group photo as reference, create a 16-bit pixel art SPRITE SHEET of the 2nd person from the LEFT, as a character for a 1990s Super Nintendo street fighting game.
Keep the same face, hair, beard, body type and clothes as in the photo.

Character: Adriano
Look: wavy dark-brown hair, big smile, black polo shirt with white "UFS" letters and red sleeve cuffs, orange-and-red lanyard with a badge, blue jeans, dark grey sneakers.
Fighting style: Boxer-style street fighter: lots of PUNCHES. Signature special is a blue energy ball thrown with both palms (classic wave-fist pose).

SHEET RULES (very important):
- Solid flat MAGENTA background (#FF00FF) filling the entire image. No gradient, no checkerboard, no floor, no ground shadow.
- Do not use pink, magenta or purple anywhere on the character or the effects.
- Every frame shows the full body, facing RIGHT, same size and scale in all frames.
- In each row, the feet stay on the same baseline.
- Leave clear empty space between frames: frames must NEVER touch or overlap.
- One animation per row, frames from left to right:
Row 1 - fighting stance idle with fists up, 6 frames
Row 2 - walking forward, 8 frames
Row 3 - jump: crouch, rise, tuck in the air, land (5 frames)
Row 4 - blocking pose (1 frame) and crouching (1 frame)
Row 5 - straight punch (4 frames) and a fast 3-punch combo (6 frames)
Row 6 - ENERGY BALL: cups both hands at the hip, blue energy charges, thrusts both palms forward (7 frames)
Row 7 - the blue energy ball alone flying (4 frames) + blue impact burst (2 frames)
Row 8 - RISING UPPERCUT: crouch, jumping uppercut with fist up high, land (6 frames)
Row 9 - high kick, 4 frames
Row 10 - getting hit (2 frames), knocked back, falling and lying on the floor (6 frames)
Row 11 - victory pose, fist in the air, 4 frames
Row 12 - burning K.O.: engulfed in flames, getting charred, 7 frames, last frame a pile of fire
- No text, no labels, no numbers, no grid lines, no borders.
- Crisp pixel art with dark outlines and a limited palette, like classic SNES fighting game sprites.
```

## Rogério

Fundo: **green** · referência: `assets/reference/elenco/3_rogerio.png` · salvar como `assets/reference/rogerio_sprites_raw.png`

```
Using the attached group photo as reference, create a 16-bit pixel art SPRITE SHEET of the 3rd person from the LEFT, as a character for a 1990s Super Nintendo street fighting game.
Keep the same face, hair, beard, body type and clothes as in the photo.

Character: Rogério
Look: short dark hair, black square glasses, black polo shirt with white "UFS" letters and red sleeve cuffs, blue jeans, black shoes.
Fighting style: Carries a silver LAPTOP. Signature gesture: CRACKING HIS KNUCKLES (fingers interlaced, palms pushed forward). Has FIRE and purple energy powers.

SHEET RULES (very important):
- Solid flat GREEN background (#00FF00) filling the entire image. No gradient, no checkerboard, no floor, no ground shadow.
- Do not use bright green anywhere on the character or the effects.
- Every frame shows the full body, facing RIGHT, same size and scale in all frames.
- In each row, the feet stay on the same baseline.
- Leave clear empty space between frames: frames must NEVER touch or overlap.
- One animation per row, frames from left to right:
Row 1 - fighting stance idle holding the closed laptop under one arm, 6 frames
Row 2 - walking forward, 8 frames
Row 3 - jump: crouch, rise, tuck in the air, land (5 frames)
Row 4 - blocking with the laptop as a shield (1 frame) and crouching (1 frame)
Row 5 - punch (4 frames) and a hit with the closed laptop like a club (5 frames)
Row 6 - KNUCKLE CRACK: interlaces fingers, pushes palms forward, small 'crack' sparks (5 frames)
Row 7 - LAPTOP FIRE: opens the laptop facing the enemy and a stream of fire shoots out of the screen (6 frames)
Row 8 - the fire blast alone flying (4 frames) + fire impact explosion (3 frames)
Row 9 - PURPLE SPHERE: cracks knuckles then launches a purple energy sphere with fire trails (6 frames) + the sphere alone (3 frames)
Row 10 - getting hit (2 frames), knocked back, falling and lying on the floor (6 frames)
Row 11 - victory pose typing on the open laptop, 4 frames
Row 12 - burning K.O.: engulfed in flames, getting charred, 7 frames, last frame a pile of fire
- No text, no labels, no numbers, no grid lines, no borders.
- Crisp pixel art with dark outlines and a limited palette, like classic SNES fighting game sprites.
```

## Barba

Fundo: **magenta** · referência: `assets/reference/elenco/4_barba.png` · salvar como `assets/reference/barba_sprites_raw.png`

```
Using the attached group photo as reference, create a 16-bit pixel art SPRITE SHEET of the 4th person from the LEFT, as a character for a 1990s Super Nintendo street fighting game.
Keep the same face, hair, beard, body type and clothes as in the photo.

Character: Barba
Look: very short hair, full dark beard, black polo shirt with white "UFS" letters and red sleeve cuffs, light grey jeans, white-and-black sneakers, black wristwatch.
Fighting style: Uses the POWER OF ARTIFICIAL INTELLIGENCE: a glowing teal-green knot/flower symbol, floating chat speech bubbles and lines of code. When powered up he goes CRAZY: rips off his shirt (shirtless), wild glowing eyes and a teal aura.

SHEET RULES (very important):
- Solid flat MAGENTA background (#FF00FF) filling the entire image. No gradient, no checkerboard, no floor, no ground shadow.
- Do not use pink, magenta or purple anywhere on the character or the effects.
- Every frame shows the full body, facing RIGHT, same size and scale in all frames.
- In each row, the feet stay on the same baseline.
- Leave clear empty space between frames: frames must NEVER touch or overlap.
- One animation per row, frames from left to right:
Row 1 - fighting stance idle, calm, 6 frames
Row 2 - walking forward, 8 frames
Row 3 - jump: crouch, rise, tuck in the air, land (5 frames)
Row 4 - blocking pose (1 frame) and crouching (1 frame)
Row 5 - punch (4 frames) and kick (4 frames)
Row 6 - AI BEAM: summons the glowing teal AI symbol in front of his hand and fires a teal beam (7 frames)
Row 7 - the teal AI projectile alone with small chat bubbles (4 frames) + teal impact burst (2 frames)
Row 8 - CRAZY MODE transformation: grabs his shirt, rips it off, becomes shirtless with teal aura (6 frames)
Row 9 - CRAZY MODE attack: shirtless, frantic fast punches with teal sparks (6 frames)
Row 10 - getting hit (2 frames), knocked back, falling and lying on the floor (6 frames)
Row 11 - victory pose, shirtless flexing with the AI symbol glowing above, 4 frames
Row 12 - burning K.O.: engulfed in flames, getting charred, 7 frames, last frame a pile of fire
- No text, no labels, no numbers, no grid lines, no borders.
- Crisp pixel art with dark outlines and a limited palette, like classic SNES fighting game sprites.
```

## Angelo

Fundo: **magenta** · referência: `assets/reference/elenco/5_angelo.png` · salvar como `assets/reference/angelo_sprites_raw.png`

```
Using the attached group photo as reference, create a 16-bit pixel art SPRITE SHEET of the 5th person from the LEFT, as a character for a 1990s Super Nintendo street fighting game.
Keep the same face, hair, beard, body type and clothes as in the photo.

Character: Angelo
Look: short brown hair, short beard, friendly smile, black polo shirt with white "UFS" letters and red sleeve cuffs, beige/khaki pants, brown shoes, silver wristwatch.
Fighting style: Fights holding a SMARTPHONE. Takes photos whose camera FLASH shoots out as a projectile. His ultimate special: his CHIN GROWS HUGE and cartoonishly long and he smashes the enemy with it.

SHEET RULES (very important):
- Solid flat MAGENTA background (#FF00FF) filling the entire image. No gradient, no checkerboard, no floor, no ground shadow.
- Do not use pink, magenta or purple anywhere on the character or the effects.
- Every frame shows the full body, facing RIGHT, same size and scale in all frames.
- In each row, the feet stay on the same baseline.
- Leave clear empty space between frames: frames must NEVER touch or overlap.
- One animation per row, frames from left to right:
Row 1 - fighting stance idle holding the smartphone, 6 frames
Row 2 - walking forward, 8 frames
Row 3 - jump: crouch, rise, tuck in the air, land (5 frames)
Row 4 - blocking pose (1 frame) and crouching (1 frame)
Row 5 - punch (4 frames) and kick (4 frames)
Row 6 - PHOTO SHOT: raises the phone, aims like a camera, bright white flash bursts from it (6 frames)
Row 7 - the camera flash projectile alone: white star-shaped flash with light-blue sparkles flying forward (4 frames) + white flash impact burst (2 frames)
Row 8 - BIG CHIN: his chin grows bigger and bigger over 3 frames until huge and long, then he swings his head forward smashing with the giant chin (6 frames)
Row 9 - the giant chin shrinking back to normal (3 frames)
Row 10 - getting hit (2 frames), knocked back, falling and lying on the floor (6 frames)
Row 11 - victory pose taking a selfie, 4 frames
Row 12 - burning K.O.: engulfed in flames, getting charred, 7 frames, last frame a pile of fire
- No text, no labels, no numbers, no grid lines, no borders.
- Crisp pixel art with dark outlines and a limited palette, like classic SNES fighting game sprites.
```

## Kaisson

Fundo: **magenta** · referência: `assets/reference/elenco/6_kaisson.png` · salvar como `assets/reference/kaisson_sprites_raw.png`

```
Using the attached group photo as reference, create a 16-bit pixel art SPRITE SHEET of the 6th person from the LEFT, as a character for a 1990s Super Nintendo street fighting game.
Keep the same face, hair, beard, body type and clothes as in the photo.

Character: Kaisson
Look: short dark-brown hair, light stubble, big smile, black polo shirt with white "UFS" letters and red sleeve cuffs, orange-and-red lanyard with a badge, dark navy jeans, white sneakers with red details.
Fighting style: Balanced street fighter with normal punches and kicks. His trick: pulls LONG FRENCH BAGUETTE breads out of his pocket and fires them like a gun/rifle, and also swings a baguette like a bat.

SHEET RULES (very important):
- Solid flat MAGENTA background (#FF00FF) filling the entire image. No gradient, no checkerboard, no floor, no ground shadow.
- Do not use pink, magenta or purple anywhere on the character or the effects.
- Every frame shows the full body, facing RIGHT, same size and scale in all frames.
- In each row, the feet stay on the same baseline.
- Leave clear empty space between frames: frames must NEVER touch or overlap.
- One animation per row, frames from left to right:
Row 1 - fighting stance idle, 6 frames
Row 2 - walking forward, 8 frames
Row 3 - jump: crouch, rise, tuck in the air, land (5 frames)
Row 4 - blocking pose (1 frame) and crouching (1 frame)
Row 5 - punch (4 frames) and kick (4 frames)
Row 6 - BREAD GUN: hand in the pocket, pulls out a long baguette, aims it like a rifle, recoil as it fires (7 frames)
Row 7 - the flying bread roll projectile alone spinning (4 frames) + crumbs explosion burst (2 frames)
Row 8 - BAGUETTE BAT: swings a long baguette like a baseball bat, the bread breaks on impact (6 frames)
Row 9 - flying kick, 4 frames
Row 10 - getting hit (2 frames), knocked back, falling and lying on the floor (6 frames)
Row 11 - victory pose biting a baguette, 4 frames
Row 12 - burning K.O.: engulfed in flames, getting charred, 7 frames, last frame a pile of fire
- No text, no labels, no numbers, no grid lines, no borders.
- Crisp pixel art with dark outlines and a limited palette, like classic SNES fighting game sprites.
```

## Alicia de Moraes

Fundo: **magenta** · referência: `assets/reference/elenco/7_alicia.png` · salvar como `assets/reference/alicia_sprites_raw.png`

```
Using the attached group photo as reference, create a 16-bit pixel art SPRITE SHEET of the 7th person from the LEFT (the last one on the right), as a character for a 1990s Super Nintendo street fighting game.
Keep the same face, hair, beard, body type and clothes as in the photo.

Character: Alicia de Moraes
Look: long straight dark hair, black polo shirt, long black wide-leg pants, bare feet / sandals.
Fighting style: Uses a long WHIP and FLOATS in the air like a powerful villain with dark psychic energy: legs together, hovering above the ground, dark purple-black aura (do not use pink).

SHEET RULES (very important):
- Solid flat MAGENTA background (#FF00FF) filling the entire image. No gradient, no checkerboard, no floor, no ground shadow.
- Do not use pink, magenta or purple anywhere on the character or the effects.
- Every frame shows the full body, facing RIGHT, same size and scale in all frames.
- In each row, the feet stay on the same baseline.
- Leave clear empty space between frames: frames must NEVER touch or overlap.
- One animation per row, frames from left to right:
Row 1 - idle floating slightly above the ground, whip in hand, 6 frames (gentle up-and-down hover)
Row 2 - moving forward while floating, 8 frames
Row 3 - jump/levitate high and come back down (5 frames)
Row 4 - blocking pose (1 frame) and crouching (1 frame)
Row 5 - short whip crack at waist height (5 frames)
Row 6 - LONG WHIP LASH: raises the whip overhead and cracks it far forward (7 frames)
Row 7 - PSYCHO DASH: wraps in dark energy and flies forward horizontally like a torpedo (6 frames)
Row 8 - dark energy ball thrown from the hand (5 frames) + the ball alone (3 frames) + impact (2 frames)
Row 9 - getting hit (2 frames), knocked back, falling and lying on the floor (6 frames)
Row 10 - victory pose floating with arms crossed and dark aura, 4 frames
Row 11 - burning K.O.: engulfed in flames, getting charred, 7 frames, last frame a pile of fire
- No text, no labels, no numbers, no grid lines, no borders.
- Crisp pixel art with dark outlines and a limited palette, like classic SNES fighting game sprites.
```

## Prompts de correção

**Se a folha saiu cortada ou com poucas linhas**

```
Continue the same sprite sheet with the same character, same style, same scale and the same solid [MAGENTA #FF00FF] background. Now draw only rows [7 to 12] from the list above.
```

**Para refazer uma linha que ficou ruim**

```
Using the attached sprite sheet as reference, redraw only row [6] ([describe the move]) as a separate image: same character, same style and scale, same solid [MAGENTA #FF00FF] background, frames facing right with empty space between them.
```

**Se o fundo veio xadrez, degradê ou com chão**

```
Redo the same image, but the background must be one single flat solid color [#FF00FF] with no checkerboard, no gradient, no floor and no shadows.
```

**Se o rosto não ficou parecido**

```
The face does not look like the person in the reference photo. Keep everything else but redraw the face to match the reference: [describe: same beard, same glasses, same hair, rounder face...].
```

**Se os quadros saíram grudados**

```
Redo the sheet with more empty space between frames. No two frames may touch or overlap, and no effect (fire, energy, whip) may cross into the neighbouring frame.
```
