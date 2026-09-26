import React from 'react';

/**
 * Scene drawings. Each entry is (styles) => JSX fragment.
 * Canvas 640x400 · horizon y=252 · vanishing point (400, 252).
 * Layer order is fixed: sky, far-hills, forest-band, mid-trees, ground,
 * road, structures, figures, foreground.
 */
export const SCENES = {
  'walk-to-market': (s) => (
    <>

      <g data-layer="sky" className={s.drift}>
        <path d="M112 64 L121 57 L130 64" className={s.birdLine} />
        <path d="M146 49 L154 43 L162 49" className={s.birdLine} />
        <path d="M174 72 L181 67 L188 72" className={s.birdLine} />
        <path d="M498 54 L505 48 L512 54" className={s.birdLine} />
        <path d="M520 66 L526 61 L532 66" className={s.birdLine} />
      </g>
      <g data-layer="far-hills">
        <path d="M-12 252 C 42 212 128 200 198 226 C 248 245 288 252 322 252 Z" className={s.fillCanvasSoft} />
        <path d="M286 252 C 348 214 436 204 508 228 C 566 247 612 252 652 252 Z" className={s.fillCanvasSoft} />
        <path d="M112 252 C 158 224 226 218 286 240" className={s.farLine} />
        <path d="M352 244 C 402 222 458 218 504 232" className={s.farLine} />
      </g>
      <g data-layer="forest-band">
        <path
          d="M-10 252
             C 8 226 34 218 50 230 C 62 210 92 206 106 224
             C 122 204 152 206 162 226 C 178 208 206 210 216 230
             C 232 212 258 214 268 232 C 284 214 310 216 320 234
             C 336 216 362 216 372 234 C 388 214 414 214 426 232
             C 442 210 470 212 482 230 C 498 208 526 210 538 228
             C 552 208 582 206 594 226 C 608 214 632 218 650 236
             L 650 252 Z"
          className={s.fillForest}
        />
        <path d="M22 252 L22 234" className={s.forestLine} />
        <path d="M86 252 L86 228" className={s.forestLine} />
        <path d="M148 252 L148 230" className={s.forestLine} />
        <path d="M206 252 L206 234" className={s.forestLine} />
        <path d="M262 252 L262 236" className={s.forestLine} />
        <path d="M318 252 L318 238" className={s.forestLine} />
        <path d="M370 252 L370 238" className={s.forestLine} />
        <path d="M428 252 L428 236" className={s.forestLine} />
        <path d="M482 252 L482 234" className={s.forestLine} />
        <path d="M540 252 L540 232" className={s.forestLine} />
        <path d="M598 252 L598 230" className={s.forestLine} />
      </g>
      <g data-layer="mid-trees">
        <path d="M60 262 L64 214 L70 214 L76 262 Z" className={s.trunk} />
        <path d="M64 228 L48 214" className={s.foliageLine} />
        <path d="M70 232 L86 216" className={s.foliageLine} />
        <ellipse cx="46" cy="204" rx="22" ry="17" className={s.fillFoliage} />
        <ellipse cx="78" cy="196" rx="25" ry="19" className={s.fillFoliage} />
        <ellipse cx="60" cy="182" rx="21" ry="16" className={s.fillFoliage} />
        <ellipse cx="94" cy="212" rx="18" ry="14" className={s.fillFoliage} />
        <ellipse cx="38" cy="220" rx="16" ry="12" className={s.fillFoliage} />
        <path d="M568 258 L571 220 L576 220 L580 258 Z" className={s.trunk} />
        <ellipse cx="558" cy="212" rx="19" ry="15" className={s.fillFoliage} />
        <ellipse cx="584" cy="204" rx="21" ry="16" className={s.fillFoliage} />
        <ellipse cx="570" cy="192" rx="17" ry="13" className={s.fillFoliage} />
        <path d="M618 256 L621 224 L626 224 L629 256 Z" className={s.trunk} />
        <ellipse cx="612" cy="216" rx="16" ry="12" className={s.fillFoliage} />
        <ellipse cx="632" cy="210" rx="17" ry="13" className={s.fillFoliage} />
      </g>
      <g data-layer="ground">
        <line x1="0" y1="252" x2="640" y2="252" className={s.horizon} />
        <path d="M0 268 C 90 262 190 266 268 262" className={s.hairline} />
        <path d="M352 260 C 448 266 552 262 640 268" className={s.hairline} />
      </g>
      <g data-layer="road">
        <path
          d="M28 400 C 140 372 292 330 392 308 L 486 308 C 452 330 374 366 302 400 Z"
          className={s.fillCanvasSoft}
        />
        <path d="M28 400 C 140 372 292 330 392 308" className={s.roadLine} />
        <path d="M302 400 C 374 366 452 330 486 308" className={s.roadLine} />
        <path d="M118 400 C 212 368 332 330 406 310" className={s.rut} />
        <path d="M226 400 C 296 366 394 330 450 310" className={s.rut} />
        <circle cx="168" cy="374" r="2.5" className={s.hairline} />
        <circle cx="243" cy="352" r="2" className={s.hairline} />
        <circle cx="316" cy="336" r="2.5" className={s.hairline} />
        <circle cx="381" cy="322" r="1.75" className={s.hairline} />
      </g>
      <g data-layer="structures">
        <path d="M6 344 L6 296" className={s.woodLine} />
        <path d="M48 338 L48 292" className={s.woodLine} />
        <path d="M86 330 L86 288" className={s.woodLine} />
        <path d="M120 322 L120 284" className={s.woodLine} />
        <path d="M150 314 L150 281" className={s.woodLine} />
        <path d="M176 306 L176 278" className={s.woodLine} />
        <path d="M198 300 L198 276" className={s.woodLine} />
        <path d="M216 294 L216 274" className={s.woodLine} />
        <path d="M4 306 C 80 296 158 286 218 280" className={s.woodLine} />
        <path d="M4 326 C 80 314 158 300 218 290" className={s.woodLine} />
        <path d="M414 306 L414 200" className={s.woodLine} />
        <path d="M596 306 L596 200" className={s.woodLine} />
        <path d="M402 196 C 470 168 542 168 610 196 L 610 206 C 542 180 470 180 402 206 Z" className={s.fillWhite} />
        <path d="M444 180 C 446 190 446 196 444 202" className={s.accentBeet} />
        <path d="M506 174 C 508 186 508 192 506 198" className={s.accentBeet} />
        <path d="M568 180 C 570 190 570 196 568 202" className={s.accentBeet} />
        <path d="M402 206 C 412 214 424 214 434 206" className={s.woodLine} />
        <path d="M434 202 C 444 210 456 210 466 202" className={s.woodLine} />
        <path d="M466 200 C 476 208 488 208 498 200" className={s.woodLine} />
        <path d="M498 200 C 508 208 520 208 530 200" className={s.woodLine} />
        <path d="M530 202 C 540 210 552 210 562 202" className={s.woodLine} />
        <path d="M562 204 C 572 212 584 212 594 204" className={s.woodLine} />
        <path d="M420 262 L592 262 L592 274 L420 274 Z" className={s.fillWood} />
        <path d="M424 274 C 448 292 490 292 514 274" className={s.fillCloth} />
        <path d="M514 274 C 538 290 570 290 588 274" className={s.fillCloth} />
        <path d="M436 240 L482 240 L482 262 L436 262 Z" className={s.fillCanvas} />
        <line x1="436" y1="248" x2="482" y2="248" className={s.woodLine} />
        <line x1="436" y1="255" x2="482" y2="255" className={s.woodLine} />
        <line x1="442" y1="240" x2="442" y2="262" className={s.hairline} />
        <line x1="476" y1="240" x2="476" y2="262" className={s.hairline} />
        <path d="M498 244 L540 244 L540 262 L498 262 Z" className={s.fillCanvas} />
        <line x1="498" y1="251" x2="540" y2="251" className={s.woodLine} />
        <line x1="504" y1="244" x2="504" y2="262" className={s.hairline} />
        <circle cx="448" cy="236" r="6" className={s.fillFoliage} />
        <circle cx="462" cy="234" r="6.5" className={s.fillFoliage} />
        <circle cx="474" cy="237" r="5.5" className={s.fillFoliage} />
        <circle cx="510" cy="240" r="5.5" className={s.fillCanvas} />
        <circle cx="524" cy="239" r="6" className={s.fillCanvas} />
        <path d="M600 274 L628 270 L632 306 L604 306 Z" className={s.fillCanvas} />
        <line x1="607" y1="282" x2="626" y2="280" className={s.hairline} />
        <line x1="607" y1="290" x2="622" y2="288" className={s.hairline} />
        <path d="M258 306 L258 246" className={s.woodLine} />
        <path d="M258 252 L296 248 L296 262 L258 266 Z" className={s.fillWhite} />
      </g>
      <g data-layer="figures">
        <ellipse cx="300" cy="346" rx="16" ry="3" className={s.fillShadow} />
        <circle cx="300" cy="284" r="8" className={s.figureLine} />
        <path d="M300 292 C 292 300 290 314 292 328 L 310 328 C 312 314 310 300 300 292 Z" className={s.figureLine} />
        <path d="M293 328 L290 344" className={s.figureLine} />
        <path d="M308 328 L312 344" className={s.figureLine} />
        <path d="M292 300 L282 320" className={s.figureLine} />
        <path d="M310 300 L320 318" className={s.figureLine} />
        <path d="M318 318 L332 318 L334 336 L316 336 Z" className={s.fillCanvas} />
        <path d="M320 318 C 322 310 330 310 332 318" className={s.figureLine} />
        <path d="M322 324 L328 324" className={s.hairline} />
        <ellipse cx="238" cy="356" rx="13" ry="2.5" className={s.fillShadow} />
        <path d="M228 352 C 228 342 248 342 248 352" className={s.figureLine} />
        <circle cx="252" cy="342" r="5.5" className={s.figureLine} />
        <path d="M250 337 L247 332" className={s.figureLine} />
        <path d="M255 337 L258 332" className={s.figureLine} />
        <path d="M230 352 L229 358" className={s.figureLine} />
        <path d="M244 352 L245 358" className={s.figureLine} />
        <path d="M228 346 C 222 342 220 336 222 332" className={s.figureLine} />
      </g>
      <g data-layer="foreground">
        <path d="M14 390 L18 372 M20 390 L22 376 M26 390 L24 374" className={s.nearLine} />
        <path d="M52 396 L56 374 M58 396 L60 380 M64 396 L62 376" className={s.nearLine} />
        <path d="M96 388 L99 370 M102 388 L104 376" className={s.nearLine} />
        <path d="M566 392 L570 368 M572 392 L575 374 M578 392 L576 370" className={s.nearLine} />
        <path d="M604 398 L608 376 M610 398 L613 382 M616 398 L614 374" className={s.nearLine} />
        <path d="M528 384 L531 368 M534 384 L536 372" className={s.nearLine} />
        <path d="M356 356 L430 356 L430 396 L356 396 Z" className={s.fillCanvas} />
        <line x1="356" y1="368" x2="430" y2="368" className={s.nearLine} />
        <line x1="356" y1="382" x2="430" y2="382" className={s.nearLine} />
        <path d="M356 356 L366 356 L366 396 L356 396 Z" className={s.fillWood} />
        <path d="M420 356 L430 356 L430 396 L420 396 Z" className={s.fillWood} />
        <path d="M382 356 L404 356 L404 361 L382 361 Z" className={s.fillWhite} />
        <path d="M366 356 C 380 348 406 348 420 356" className={s.hairline} />
        <circle cx="444" cy="388" r="8" className={s.fillCanvas} />
        <path d="M444 380 C 446 374 452 372 454 374" className={s.nearLine} />
      </g>
    </>
  ),

  'empty-basket': (s) => (
    <>

      
      {/* ── 1 · SKY ─────────────────────────────────────────────── */}
      <g data-layer="sky" className={s.drift}>
        <path d="M106 62 L114 56 L122 62" className={s.birdLine} />
        <path d="M138 48 L145 43 L152 48" className={s.birdLine} />
        <path d="M166 68 L172 63 L178 68" className={s.birdLine} />
        <path d="M486 54 L493 48 L500 54" className={s.birdLine} />
        <path d="M510 66 L516 61 L522 66" className={s.birdLine} />
        <path d="M536 50 L543 44 L550 50" className={s.birdLine} />
      </g>

      {/* ── 2 · FAR HILLS ───────────────────────────────────────── */}
      <g data-layer="far-hills">
        <path d="M-12 252 C 44 212 128 202 198 226 C 248 244 288 252 324 252 Z" className={s.fillCanvasSoft} />
        <path d="M284 252 C 348 214 436 204 510 228 C 566 247 612 252 652 252 Z" className={s.fillCanvasSoft} />
        <path d="M112 250 C 158 224 226 218 286 240" className={s.farLine} />
        <path d="M352 244 C 402 222 458 218 504 232" className={s.farLine} />
        <path d="M40 252 C 86 230 148 226 202 244" className={s.farLine} />
        <path d="M440 248 C 490 228 546 226 596 240" className={s.farLine} />
      </g>

      {/* ── 3 · FOREST BAND ─────────────────────────────────────── */}
      <g data-layer="forest-band">
        <path
          d="M-10 252
             C 8 226 34 218 50 230 C 62 210 92 206 106 224
             C 122 204 152 206 162 226 C 178 208 206 210 216 230
             C 232 212 258 214 268 232 C 284 214 310 216 320 234
             C 336 216 362 216 372 234 C 388 214 414 214 426 232
             C 442 210 470 212 482 230 C 498 208 526 210 538 228
             C 552 208 582 206 594 226 C 608 214 632 218 650 236
             L 650 252 Z"
          className={s.fillForest}
        />
        <path d="M22 252 L22 234" className={s.forestLine} />
        <path d="M68 252 L68 230" className={s.forestLine} />
        <path d="M110 252 L110 228" className={s.forestLine} />
        <path d="M152 252 L152 232" className={s.forestLine} />
        <path d="M196 252 L196 234" className={s.forestLine} />
        <path d="M240 252 L240 236" className={s.forestLine} />
        <path d="M284 252 L284 238" className={s.forestLine} />
        <path d="M326 252 L326 238" className={s.forestLine} />
        <path d="M368 252 L368 238" className={s.forestLine} />
        <path d="M410 252 L410 236" className={s.forestLine} />
        <path d="M452 252 L452 234" className={s.forestLine} />
        <path d="M494 252 L494 232" className={s.forestLine} />
        <path d="M536 252 L536 232" className={s.forestLine} />
        <path d="M578 252 L578 230" className={s.forestLine} />
        <path d="M618 252 L618 234" className={s.forestLine} />
      </g>

      {/* ── 4 · MID TREES ───────────────────────────────────────── */}
      <g data-layer="mid-trees">
        <path d="M54 260 L58 214 L64 214 L69 260 Z" className={s.trunk} />
        <path d="M58 228 L44 214" className={s.foliageLine} />
        <path d="M64 232 L78 216" className={s.foliageLine} />
        <ellipse cx="42" cy="204" rx="21" ry="16" className={s.fillFoliage} />
        <ellipse cx="72" cy="196" rx="23" ry="18" className={s.fillFoliage} />
        <ellipse cx="56" cy="182" rx="20" ry="15" className={s.fillFoliage} />
        <ellipse cx="86" cy="210" rx="17" ry="13" className={s.fillFoliage} />
        <ellipse cx="34" cy="218" rx="15" ry="11" className={s.fillFoliage} />

        <path d="M574 258 L577 220 L582 220 L586 258 Z" className={s.trunk} />
        <path d="M577 232 L566 220" className={s.foliageLine} />
        <ellipse cx="564" cy="212" rx="19" ry="14" className={s.fillFoliage} />
        <ellipse cx="590" cy="204" rx="21" ry="15" className={s.fillFoliage} />
        <ellipse cx="576" cy="192" rx="17" ry="12" className={s.fillFoliage} />

        <path d="M620 256 L623 224 L627 224 L630 256 Z" className={s.trunk} />
        <ellipse cx="614" cy="216" rx="16" ry="12" className={s.fillFoliage} />
        <ellipse cx="632" cy="210" rx="17" ry="13" className={s.fillFoliage} />
      </g>

      {/* ── 5 · GROUND ──────────────────────────────────────────── */}
      <g data-layer="ground">
        <line x1="0" y1="252" x2="640" y2="252" className={s.horizon} />
        <path d="M0 266 C 90 260 180 264 260 260" className={s.hairline} />
        <path d="M380 260 C 470 264 560 260 640 266" className={s.hairline} />
        <path d="M0 280 C 100 274 190 278 280 274" className={s.hairline} />
      </g>

      {/* ── 6 · ROAD ────────────────────────────────────────────── */}
      <g data-layer="road">
        <path d="M30 400 C 130 370 260 330 380 306 L 460 306 C 420 330 340 366 260 400 Z" className={s.fillCanvasSoft} />
        <path d="M30 400 C 130 370 260 330 380 306" className={s.roadLine} />
        <path d="M260 400 C 340 366 420 330 460 306" className={s.roadLine} />
        <path d="M110 400 C 190 366 300 330 396 308" className={s.rut} />
        <path d="M180 400 C 250 366 340 330 420 308" className={s.rut} />
        <circle cx="150" cy="376" r="2.5" className={s.hairline} />
        <circle cx="220" cy="356" r="2" className={s.hairline} />
        <circle cx="280" cy="342" r="2.5" className={s.hairline} />
        <circle cx="340" cy="330" r="1.75" className={s.hairline} />
      </g>
      <g data-layer="structures">
        <path d="M120 280 L120 220" className={s.woodLine} />
        <path d="M210 280 L210 220" className={s.woodLine} />
        <path d="M114 218 C 160 200 200 200 220 218 Z" className={s.fillWhite} />
        <line x1="120" y1="252" x2="210" y2="252" className={s.woodLine} />
        <path d="M124 252 L150 252 L150 266 L124 266 Z" className={s.fillCanvas} />
        <line x1="124" y1="259" x2="150" y2="259" className={s.woodLine} />
        <line x1="130" y1="252" x2="130" y2="266" className={s.hairline} />
        <path d="M430 284 L430 216" className={s.woodLine} />
        <path d="M540 284 L540 216" className={s.woodLine} />
        <path d="M422 214 C 476 196 524 196 550 214 Z" className={s.fillWhite} />
        <line x1="430" y1="250" x2="540" y2="250" className={s.woodLine} />
        <path d="M440 250 L474 250 L474 266 L440 266 Z" className={s.fillCanvas} />
        <line x1="440" y1="258" x2="474" y2="258" className={s.woodLine} />
        <line x1="446" y1="250" x2="446" y2="266" className={s.hairline} />
        <path d="M486 250 L520 250 L520 266 L486 266 Z" className={s.fillCanvas} />
        <line x1="486" y1="258" x2="520" y2="258" className={s.woodLine} />
        <line x1="492" y1="250" x2="492" y2="266" className={s.hairline} />
        <path d="M210 224 C 290 240 370 240 430 222" className={s.hairline} />
        <polygon points="250,232 258,244 266,233" className={s.fillCanvas} />
        <polygon points="290,236 298,248 306,237" className={s.fillWhite} />
        <polygon points="330,237 338,249 346,238" className={s.fillCanvas} />
        <polygon points="370,235 378,247 386,236" className={s.fillWhite} />
      </g>
      <g data-layer="figures">
        <ellipse cx="360" cy="286" rx="8" ry="2" className={s.fillShadow} />
        <circle cx="360" cy="254" r="4.5" className={s.figureLine} />
        <path d="M360 258 L356 274 L364 274 Z" className={s.figureLine} />
        <path d="M357 274 L356 284" className={s.figureLine} />
        <path d="M363 274 L364 284" className={s.figureLine} />
      </g>
      
      {/* ── 9 · FOREGROUND ──────────────────────────────────────── */}
      <g data-layer="foreground">
        
        <ellipse cx="320" cy="388" rx="200" ry="10" className={s.fillShadow} />
        <path d="M172 386 L180 322 L192 322 L184 386 Z" className={s.woodLine} />
        <path d="M214 386 L206 322 L196 322 L202 386 Z" className={s.woodLine} />
        <line x1="176" y1="362" x2="208" y2="362" className={s.woodLine} />
        <circle cx="192" cy="362" r="1.5" className={s.hairline} />
        <path d="M434 386 L442 322 L454 322 L446 386 Z" className={s.woodLine} />
        <path d="M476 386 L468 322 L458 322 L464 386 Z" className={s.woodLine} />
        <line x1="438" y1="362" x2="470" y2="362" className={s.woodLine} />
        <circle cx="454" cy="362" r="1.5" className={s.hairline} />
        <path d="M140 314 L500 314 L500 326 L140 326 Z" className={s.fillWood} />
        <line x1="140" y1="318" x2="500" y2="318" className={s.hairline} />
        <line x1="140" y1="322" x2="500" y2="322" className={s.hairline} />
        <path d="M164 308 L232 308 L238 344 L160 342 Z" className={s.fillCloth} />
        <path d="M160 342 C 180 350 216 350 238 344" className={s.woodLine} />
        <line x1="180" y1="314" x2="176" y2="342" className={s.hairline} />
        <line x1="202" y1="314" x2="198" y2="343" className={s.hairline} />
        <line x1="222" y1="314" x2="220" y2="341" className={s.hairline} />
        <ellipse cx="340" cy="316" rx="66" ry="12" className={s.fillShadow} />
        <path d="M276 270 C 274 304 294 316 340 316 C 386 316 406 304 404 270 Z" className={s.fillCanvas} />
        <ellipse cx="340" cy="270" rx="64" ry="15" className={s.fillCanvasSoft} />
        <ellipse cx="340" cy="270" rx="64" ry="15" className={s.nearLine} />
        <ellipse cx="340" cy="282" rx="46" ry="10" className={s.hairline} />
        <ellipse cx="340" cy="286" rx="36" ry="7" className={s.hairline} />
        <path d="M284 274 C 284 292 292 304 304 312" className={s.woodLine} />
        <path d="M292 276 C 293 294 300 306 312 313" className={s.woodLine} />
        <path d="M300 278 C 302 296 310 308 322 314" className={s.woodLine} />
        <path d="M310 280 C 312 297 318 309 328 314" className={s.woodLine} />
        <path d="M320 281 C 322 298 328 310 336 315" className={s.woodLine} />
        <path d="M330 282 C 331 299 334 310 338 316" className={s.woodLine} />
        <path d="M340 282 C 340 299 341 310 341 316" className={s.woodLine} />
        <path d="M350 282 C 349 299 346 310 342 316" className={s.woodLine} />
        <path d="M360 281 C 358 298 353 310 346 315" className={s.woodLine} />
        <path d="M370 280 C 368 297 362 309 352 314" className={s.woodLine} />
        <path d="M380 278 C 378 296 370 308 358 314" className={s.woodLine} />
        <path d="M388 276 C 387 294 380 306 368 313" className={s.woodLine} />
        <path d="M396 274 C 395 292 387 304 376 312" className={s.woodLine} />
        <path d="M276 278 C 300 292 380 292 404 278" className={s.woodLine} />
        <path d="M276 284 C 300 298 380 298 404 284" className={s.woodLine} />
        <path d="M278 290 C 302 302 378 302 402 290" className={s.woodLine} />
        <path d="M280 296 C 304 308 376 308 400 296" className={s.woodLine} />
        <path d="M284 303 C 306 313 374 313 396 303" className={s.woodLine} />
        <path d="M290 309 C 310 316 370 316 390 309" className={s.woodLine} />
        <path d="M276 270 C 274 212 406 212 404 270" className={s.nearLine} />
        <path d="M280 268 C 278 216 402 216 400 268" className={s.hairline} />
        <line x1="306" y1="234" x2="312" y2="242" className={s.hairline} />
        <line x1="316" y1="228" x2="322" y2="236" className={s.hairline} />
        <line x1="326" y1="224" x2="332" y2="232" className={s.hairline} />
        <line x1="337" y1="222" x2="343" y2="230" className={s.hairline} />
        <line x1="348" y1="224" x2="354" y2="232" className={s.hairline} />
        <line x1="358" y1="228" x2="364" y2="236" className={s.hairline} />
        <line x1="368" y1="234" x2="374" y2="242" className={s.hairline} />
        <path d="M288 248 C 282 242 278 252 284 258 C 290 264 294 252 288 248 Z" className={s.accentBeet} />
        <path d="M284 256 C 278 266 272 276 276 286" className={s.accentBeet} />
        <path d="M286 256 C 288 268 284 278 286 288" className={s.accentBeet} />
        <path d="M436 318 C 444 314 450 318 448 322 C 442 324 436 322 436 318 Z" className={s.fillFoliage} />
        <line x1="436" y1="318" x2="448" y2="322" className={s.hairline} />
      
        <path d="M14 392 L18 374 M20 392 L22 378 M26 392 L24 376" className={s.nearLine} />
        <path d="M48 396 L52 376 M54 396 L57 382 M60 396 L58 378" className={s.nearLine} />
        <path d="M86 390 L90 372 M93 390 L95 378 M98 390 L96 374" className={s.nearLine} />
        <path d="M536 392 L540 372 M543 392 L546 378 M549 392 L548 374" className={s.nearLine} />
        <path d="M574 396 L578 376 M580 396 L583 382 M586 396 L584 378" className={s.nearLine} />
        <path d="M608 398 L612 376 M614 398 L617 382 M620 398 L618 374" className={s.nearLine} />
        <circle cx="112" cy="386" r="2.5" className={s.hairline} />
        <circle cx="126" cy="392" r="2" className={s.hairline} />
        <circle cx="496" cy="388" r="2.5" className={s.hairline} />
        <circle cx="510" cy="394" r="1.75" className={s.hairline} />
      </g>
    </>
  ),

  'no-orders-yet': (s) => (
    <>

      
      {/* ── 1 · SKY ─────────────────────────────────────────────── */}
      <g data-layer="sky" className={s.drift}>
        <path d="M106 62 L114 56 L122 62" className={s.birdLine} />
        <path d="M138 48 L145 43 L152 48" className={s.birdLine} />
        <path d="M166 68 L172 63 L178 68" className={s.birdLine} />
        <path d="M486 54 L493 48 L500 54" className={s.birdLine} />
        <path d="M510 66 L516 61 L522 66" className={s.birdLine} />
        <path d="M536 50 L543 44 L550 50" className={s.birdLine} />
      </g>

      {/* ── 2 · FAR HILLS ───────────────────────────────────────── */}
      <g data-layer="far-hills">
        <path d="M-12 252 C 44 212 128 202 198 226 C 248 244 288 252 324 252 Z" className={s.fillCanvasSoft} />
        <path d="M284 252 C 348 214 436 204 510 228 C 566 247 612 252 652 252 Z" className={s.fillCanvasSoft} />
        <path d="M112 250 C 158 224 226 218 286 240" className={s.farLine} />
        <path d="M352 244 C 402 222 458 218 504 232" className={s.farLine} />
        <path d="M40 252 C 86 230 148 226 202 244" className={s.farLine} />
        <path d="M440 248 C 490 228 546 226 596 240" className={s.farLine} />
      </g>

      {/* ── 3 · FOREST BAND ─────────────────────────────────────── */}
      <g data-layer="forest-band">
        <path
          d="M-10 252
             C 8 226 34 218 50 230 C 62 210 92 206 106 224
             C 122 204 152 206 162 226 C 178 208 206 210 216 230
             C 232 212 258 214 268 232 C 284 214 310 216 320 234
             C 336 216 362 216 372 234 C 388 214 414 214 426 232
             C 442 210 470 212 482 230 C 498 208 526 210 538 228
             C 552 208 582 206 594 226 C 608 214 632 218 650 236
             L 650 252 Z"
          className={s.fillForest}
        />
        <path d="M22 252 L22 234" className={s.forestLine} />
        <path d="M68 252 L68 230" className={s.forestLine} />
        <path d="M110 252 L110 228" className={s.forestLine} />
        <path d="M152 252 L152 232" className={s.forestLine} />
        <path d="M196 252 L196 234" className={s.forestLine} />
        <path d="M240 252 L240 236" className={s.forestLine} />
        <path d="M284 252 L284 238" className={s.forestLine} />
        <path d="M326 252 L326 238" className={s.forestLine} />
        <path d="M368 252 L368 238" className={s.forestLine} />
        <path d="M410 252 L410 236" className={s.forestLine} />
        <path d="M452 252 L452 234" className={s.forestLine} />
        <path d="M494 252 L494 232" className={s.forestLine} />
        <path d="M536 252 L536 232" className={s.forestLine} />
        <path d="M578 252 L578 230" className={s.forestLine} />
        <path d="M618 252 L618 234" className={s.forestLine} />
      </g>

      {/* ── 4 · MID TREES ───────────────────────────────────────── */}
      <g data-layer="mid-trees">
        <path d="M54 260 L58 214 L64 214 L69 260 Z" className={s.trunk} />
        <path d="M58 228 L44 214" className={s.foliageLine} />
        <path d="M64 232 L78 216" className={s.foliageLine} />
        <ellipse cx="42" cy="204" rx="21" ry="16" className={s.fillFoliage} />
        <ellipse cx="72" cy="196" rx="23" ry="18" className={s.fillFoliage} />
        <ellipse cx="56" cy="182" rx="20" ry="15" className={s.fillFoliage} />
        <ellipse cx="86" cy="210" rx="17" ry="13" className={s.fillFoliage} />
        <ellipse cx="34" cy="218" rx="15" ry="11" className={s.fillFoliage} />

        <path d="M574 258 L577 220 L582 220 L586 258 Z" className={s.trunk} />
        <path d="M577 232 L566 220" className={s.foliageLine} />
        <ellipse cx="564" cy="212" rx="19" ry="14" className={s.fillFoliage} />
        <ellipse cx="590" cy="204" rx="21" ry="15" className={s.fillFoliage} />
        <ellipse cx="576" cy="192" rx="17" ry="12" className={s.fillFoliage} />

        <path d="M620 256 L623 224 L627 224 L630 256 Z" className={s.trunk} />
        <ellipse cx="614" cy="216" rx="16" ry="12" className={s.fillFoliage} />
        <ellipse cx="632" cy="210" rx="17" ry="13" className={s.fillFoliage} />
      </g>

      {/* ── 5 · GROUND ──────────────────────────────────────────── */}
      <g data-layer="ground">
        <line x1="0" y1="252" x2="640" y2="252" className={s.horizon} />
        <path d="M0 266 C 90 260 180 264 260 260" className={s.hairline} />
        <path d="M380 260 C 470 264 560 260 640 266" className={s.hairline} />
        <path d="M0 280 C 100 274 190 278 280 274" className={s.hairline} />
      </g>

      {/* ── 6 · ROAD ────────────────────────────────────────────── */}
      <g data-layer="road">
        <path d="M30 400 C 130 370 260 330 380 306 L 460 306 C 420 330 340 366 260 400 Z" className={s.fillCanvasSoft} />
        <path d="M30 400 C 130 370 260 330 380 306" className={s.roadLine} />
        <path d="M260 400 C 340 366 420 330 460 306" className={s.roadLine} />
        <path d="M110 400 C 190 366 300 330 396 308" className={s.rut} />
        <path d="M180 400 C 250 366 340 330 420 308" className={s.rut} />
        <circle cx="150" cy="376" r="2.5" className={s.hairline} />
        <circle cx="220" cy="356" r="2" className={s.hairline} />
        <circle cx="280" cy="342" r="2.5" className={s.hairline} />
        <circle cx="340" cy="330" r="1.75" className={s.hairline} />
      </g>
      <g data-layer="structures">
        <path d="M140 340 L140 180" className={s.woodLine} />
        <path d="M500 340 L500 180" className={s.woodLine} />
        <path d="M128 174 C 220 148 420 148 512 174 L 512 186 C 420 162 220 162 128 186 Z" className={s.fillWhite} />
        <line x1="140" y1="184" x2="500" y2="184" className={s.woodLine} />
        <path d="M128 186 C 142 196 158 196 172 186" className={s.woodLine} />
        <path d="M172 186 C 186 196 202 196 216 186" className={s.woodLine} />
        <path d="M216 186 C 230 196 246 196 260 186" className={s.woodLine} />
        <path d="M260 186 C 274 196 290 196 304 186" className={s.woodLine} />
        <path d="M304 186 C 318 196 334 196 348 186" className={s.woodLine} />
        <path d="M348 186 C 362 196 378 196 392 186" className={s.woodLine} />
        <path d="M392 186 C 406 196 422 196 436 186" className={s.woodLine} />
        <path d="M436 186 C 450 196 466 196 480 186" className={s.woodLine} />
        <path d="M480 186 C 494 196 504 196 512 186" className={s.woodLine} />
        <path d="M144 268 L496 268 L496 282 L144 282 Z" className={s.fillWood} />
        <line x1="144" y1="274" x2="496" y2="274" className={s.hairline} />
        <path d="M148 282 L206 282 L206 336 L148 336 Z" className={s.fillCanvas} />
        <line x1="148" y1="298" x2="206" y2="298" className={s.woodLine} />
        <line x1="148" y1="316" x2="206" y2="316" className={s.woodLine} />
        <line x1="156" y1="282" x2="156" y2="336" className={s.hairline} />
        <line x1="198" y1="282" x2="198" y2="336" className={s.hairline} />
        <path d="M152 232 L202 232 L202 268 L152 268 Z" className={s.fillCanvas} />
        <line x1="152" y1="244" x2="202" y2="244" className={s.woodLine} />
        <line x1="152" y1="256" x2="202" y2="256" className={s.woodLine} />
        <line x1="160" y1="232" x2="160" y2="268" className={s.hairline} />
        <line x1="194" y1="232" x2="194" y2="268" className={s.hairline} />
        <path d="M434 282 L492 282 L492 336 L434 336 Z" className={s.fillCanvas} />
        <line x1="434" y1="298" x2="492" y2="298" className={s.woodLine} />
        <line x1="434" y1="316" x2="492" y2="316" className={s.woodLine} />
        <line x1="442" y1="282" x2="442" y2="336" className={s.hairline} />
        <line x1="484" y1="282" x2="484" y2="336" className={s.hairline} />
        <path d="M438 232 L488 232 L488 268 L438 268 Z" className={s.fillCanvas} />
        <line x1="438" y1="244" x2="488" y2="244" className={s.woodLine} />
        <line x1="438" y1="256" x2="488" y2="256" className={s.woodLine} />
        <line x1="446" y1="232" x2="446" y2="268" className={s.hairline} />
        <line x1="480" y1="232" x2="480" y2="268" className={s.hairline} />
        <circle cx="224" cy="262" r="6" className={s.fillFoliage} />
        <circle cx="236" cy="260" r="6.5" className={s.fillFoliage} />
        <circle cx="248" cy="262" r="5.5" className={s.fillFoliage} />
        <circle cx="260" cy="263" r="5" className={s.fillFoliage} />
        <circle cx="390" cy="263" r="5.5" className={s.fillCanvas} />
        <circle cx="402" cy="261" r="6" className={s.fillCanvas} />
        <circle cx="414" cy="261" r="6.5" className={s.fillCanvas} />
      </g>
      <g data-layer="figures">
        <ellipse cx="376" cy="292" rx="16" ry="3" className={s.fillShadow} />
        <circle cx="376" cy="216" r="9" className={s.figureLine} />
        <path d="M366 226 C 362 238 360 252 362 268 L 390 268 C 392 252 390 238 386 226 Z" className={s.figureLine} />
        <path d="M368 238 L384 238 L386 268 L366 268 Z" className={s.fillWhite} />
        <line x1="368" y1="238" x2="368" y2="228" className={s.figureLine} />
        <line x1="384" y1="238" x2="384" y2="228" className={s.figureLine} />
        <path d="M364 236 L342 250" className={s.figureLine} />
        <path d="M386 236 L396 250" className={s.figureLine} />
        <ellipse cx="292" cy="344" rx="18" ry="3.5" className={s.fillShadow} />
        <circle cx="292" cy="256" r="9" className={s.figureLine} />
        <path d="M292 266 C 282 278 280 298 282 320 L 304 320 C 306 298 304 278 292 266 Z" className={s.figureLine} />
        <path d="M284 320 L282 342" className={s.figureLine} />
        <path d="M302 320 L304 342" className={s.figureLine} />
        <path d="M284 278 L274 298" className={s.figureLine} />
        <path d="M300 278 L320 258" className={s.figureLine} />
        <path d="M322 244 L342 242 L345 264 L323 266 Z" className={s.accentCarrotFill} />
        <path d="M324 244 L333 240 L341 242" className={s.accentCarrot} />
        <line x1="324" y1="248" x2="343" y2="246" className={s.accentCarrot} />
      </g>
      
      {/* ── 9 · FOREGROUND ──────────────────────────────────────── */}
      <g data-layer="foreground">
        
        <path d="M14 392 L18 374 M20 392 L22 378 M26 392 L24 376" className={s.nearLine} />
        <path d="M48 396 L52 376 M54 396 L57 382 M60 396 L58 378" className={s.nearLine} />
        <path d="M86 390 L90 372 M93 390 L95 378 M98 390 L96 374" className={s.nearLine} />
        <path d="M536 392 L540 372 M543 392 L546 378 M549 392 L548 374" className={s.nearLine} />
        <path d="M574 396 L578 376 M580 396 L583 382 M586 396 L584 378" className={s.nearLine} />
        <path d="M608 398 L612 376 M614 398 L617 382 M620 398 L618 374" className={s.nearLine} />
        <circle cx="112" cy="386" r="2.5" className={s.hairline} />
        <circle cx="126" cy="392" r="2" className={s.hairline} />
        <circle cx="496" cy="388" r="2.5" className={s.hairline} />
        <circle cx="510" cy="394" r="1.75" className={s.hairline} />
      </g>
    </>
  ),

  'nothing-saved': (s) => (
    <>

      
      {/* ── 1 · SKY ─────────────────────────────────────────────── */}
      <g data-layer="sky" className={s.drift}>
        <path d="M106 62 L114 56 L122 62" className={s.birdLine} />
        <path d="M138 48 L145 43 L152 48" className={s.birdLine} />
        <path d="M166 68 L172 63 L178 68" className={s.birdLine} />
        <path d="M486 54 L493 48 L500 54" className={s.birdLine} />
        <path d="M510 66 L516 61 L522 66" className={s.birdLine} />
        <path d="M536 50 L543 44 L550 50" className={s.birdLine} />
      </g>

      {/* ── 2 · FAR HILLS ───────────────────────────────────────── */}
      <g data-layer="far-hills">
        <path d="M-12 252 C 44 212 128 202 198 226 C 248 244 288 252 324 252 Z" className={s.fillCanvasSoft} />
        <path d="M284 252 C 348 214 436 204 510 228 C 566 247 612 252 652 252 Z" className={s.fillCanvasSoft} />
        <path d="M112 250 C 158 224 226 218 286 240" className={s.farLine} />
        <path d="M352 244 C 402 222 458 218 504 232" className={s.farLine} />
        <path d="M40 252 C 86 230 148 226 202 244" className={s.farLine} />
        <path d="M440 248 C 490 228 546 226 596 240" className={s.farLine} />
      </g>

      {/* ── 3 · FOREST BAND ─────────────────────────────────────── */}
      <g data-layer="forest-band">
        <path
          d="M-10 252
             C 8 226 34 218 50 230 C 62 210 92 206 106 224
             C 122 204 152 206 162 226 C 178 208 206 210 216 230
             C 232 212 258 214 268 232 C 284 214 310 216 320 234
             C 336 216 362 216 372 234 C 388 214 414 214 426 232
             C 442 210 470 212 482 230 C 498 208 526 210 538 228
             C 552 208 582 206 594 226 C 608 214 632 218 650 236
             L 650 252 Z"
          className={s.fillForest}
        />
        <path d="M22 252 L22 234" className={s.forestLine} />
        <path d="M68 252 L68 230" className={s.forestLine} />
        <path d="M110 252 L110 228" className={s.forestLine} />
        <path d="M152 252 L152 232" className={s.forestLine} />
        <path d="M196 252 L196 234" className={s.forestLine} />
        <path d="M240 252 L240 236" className={s.forestLine} />
        <path d="M284 252 L284 238" className={s.forestLine} />
        <path d="M326 252 L326 238" className={s.forestLine} />
        <path d="M368 252 L368 238" className={s.forestLine} />
        <path d="M410 252 L410 236" className={s.forestLine} />
        <path d="M452 252 L452 234" className={s.forestLine} />
        <path d="M494 252 L494 232" className={s.forestLine} />
        <path d="M536 252 L536 232" className={s.forestLine} />
        <path d="M578 252 L578 230" className={s.forestLine} />
        <path d="M618 252 L618 234" className={s.forestLine} />
      </g>

      {/* ── 4 · MID TREES ───────────────────────────────────────── */}
      <g data-layer="mid-trees">
        <path d="M54 260 L58 214 L64 214 L69 260 Z" className={s.trunk} />
        <path d="M58 228 L44 214" className={s.foliageLine} />
        <path d="M64 232 L78 216" className={s.foliageLine} />
        <ellipse cx="42" cy="204" rx="21" ry="16" className={s.fillFoliage} />
        <ellipse cx="72" cy="196" rx="23" ry="18" className={s.fillFoliage} />
        <ellipse cx="56" cy="182" rx="20" ry="15" className={s.fillFoliage} />
        <ellipse cx="86" cy="210" rx="17" ry="13" className={s.fillFoliage} />
        <ellipse cx="34" cy="218" rx="15" ry="11" className={s.fillFoliage} />

        <path d="M574 258 L577 220 L582 220 L586 258 Z" className={s.trunk} />
        <path d="M577 232 L566 220" className={s.foliageLine} />
        <ellipse cx="564" cy="212" rx="19" ry="14" className={s.fillFoliage} />
        <ellipse cx="590" cy="204" rx="21" ry="15" className={s.fillFoliage} />
        <ellipse cx="576" cy="192" rx="17" ry="12" className={s.fillFoliage} />

        <path d="M620 256 L623 224 L627 224 L630 256 Z" className={s.trunk} />
        <ellipse cx="614" cy="216" rx="16" ry="12" className={s.fillFoliage} />
        <ellipse cx="632" cy="210" rx="17" ry="13" className={s.fillFoliage} />
      </g>

      {/* ── 5 · GROUND ──────────────────────────────────────────── */}
      <g data-layer="ground">
        <line x1="0" y1="252" x2="640" y2="252" className={s.horizon} />
        <path d="M0 266 C 90 260 180 264 260 260" className={s.hairline} />
        <path d="M380 260 C 470 264 560 260 640 266" className={s.hairline} />
        <path d="M0 280 C 100 274 190 278 280 274" className={s.hairline} />
      </g>

      {/* ── 6 · ROAD ────────────────────────────────────────────── */}
      <g data-layer="road">
        <path d="M30 400 C 130 370 260 330 380 306 L 460 306 C 420 330 340 366 260 400 Z" className={s.fillCanvasSoft} />
        <path d="M30 400 C 130 370 260 330 380 306" className={s.roadLine} />
        <path d="M260 400 C 340 366 420 330 460 306" className={s.roadLine} />
        <path d="M110 400 C 190 366 300 330 396 308" className={s.rut} />
        <path d="M180 400 C 250 366 340 330 420 308" className={s.rut} />
        <circle cx="150" cy="376" r="2.5" className={s.hairline} />
        <circle cx="220" cy="356" r="2" className={s.hairline} />
        <circle cx="280" cy="342" r="2.5" className={s.hairline} />
        <circle cx="340" cy="330" r="1.75" className={s.hairline} />
      </g>
      <g data-layer="structures">
        <path d="M410 304 L410 200" className={s.woodLine} />
        <path d="M580 304 L580 200" className={s.woodLine} />
        <path d="M398 196 C 460 172 530 172 592 196 L 592 206 C 530 182 460 182 398 206 Z" className={s.fillWhite} />
        <path d="M398 206 C 412 214 426 214 440 206" className={s.woodLine} />
        <path d="M440 206 C 454 214 468 214 482 206" className={s.woodLine} />
        <path d="M482 206 C 496 214 510 214 524 206" className={s.woodLine} />
        <path d="M524 206 C 538 214 552 214 566 206" className={s.woodLine} />
        <path d="M566 206 C 578 214 586 214 592 206" className={s.woodLine} />
        <path d="M414 262 L576 262 L576 274 L414 274 Z" className={s.fillWood} />
        <path d="M428 244 L472 244 L472 262 L428 262 Z" className={s.fillCanvas} />
        <line x1="428" y1="253" x2="472" y2="253" className={s.woodLine} />
        <line x1="434" y1="244" x2="434" y2="262" className={s.hairline} />
        <line x1="466" y1="244" x2="466" y2="262" className={s.hairline} />
        <path d="M484 246 L526 246 L526 262 L484 262 Z" className={s.fillCanvas} />
        <line x1="484" y1="254" x2="526" y2="254" className={s.woodLine} />
        <line x1="490" y1="246" x2="490" y2="262" className={s.hairline} />
        <line x1="520" y1="246" x2="520" y2="262" className={s.hairline} />
        <circle cx="440" cy="240" r="5.5" className={s.fillFoliage} />
        <circle cx="452" cy="238" r="6" className={s.fillFoliage} />
        <circle cx="496" cy="242" r="5" className={s.fillCanvas} />
        <circle cx="508" cy="241" r="5.5" className={s.fillCanvas} />
      </g>
      <g data-layer="figures">
        <ellipse cx="360" cy="308" rx="10" ry="2.5" className={s.fillShadow} />
        <circle cx="360" cy="270" r="6" className={s.figureLine} />
        <path d="M360 276 L355 296 L365 296 Z" className={s.figureLine} />
        <path d="M356 296 L355 306" className={s.figureLine} />
        <path d="M364 296 L365 306" className={s.figureLine} />
      </g>
      
      {/* ── 9 · FOREGROUND ──────────────────────────────────────── */}
      <g data-layer="foreground">
        
        <ellipse cx="230" cy="386" rx="90" ry="8" className={s.fillShadow} />
        <path d="M148 318 L296 318 L296 384 L148 384 Z" className={s.fillCanvas} />
        <line x1="148" y1="334" x2="296" y2="334" className={s.nearLine} />
        <line x1="148" y1="352" x2="296" y2="352" className={s.nearLine} />
        <line x1="148" y1="368" x2="296" y2="368" className={s.nearLine} />
        <path d="M148 318 L160 318 L160 384 L148 384 Z" className={s.fillWood} />
        <path d="M284 318 L296 318 L296 384 L284 384 Z" className={s.fillWood} />
        <line x1="154" y1="324" x2="154" y2="378" className={s.hairline} />
        <line x1="290" y1="324" x2="290" y2="378" className={s.hairline} />

        <path d="M210 264 L306 256 L314 348 L218 356 Z" className={s.fillWood} />
        <path d="M218 270 L298 264 L304 340 L224 348 Z" className={s.fillCanvas} />
        <line x1="220" y1="346" x2="304" y2="338" className={s.nearLine} />
        <rect x="238" y="342" width="14" height="3" rx="1" className={s.fillWhite} />

        {/* ACCENT: Chalk heart drawn on the board in beet */}
        <path
          d="M260 292
             C 256 284 246 284 242 290
             C 236 298 244 308 260 320
             C 276 308 284 298 278 290
             C 274 284 264 284 260 292 Z"
          className={s.accentBeet}
        />

        <ellipse cx="330" cy="380" rx="9" ry="3" className={s.fillShadow} />
        <path d="M330 358 C 324 364 320 372 322 378 C 324 384 336 384 338 378 C 340 372 336 364 330 358 Z" className={s.fillCanvas} />
        <path d="M330 358 C 330 352 334 350 336 352" className={s.nearLine} />
        <path d="M336 352 C 340 350 342 354 340 356 Z" className={s.fillFoliage} />
        <line x1="337" y1="352" x2="340" y2="355" className={s.hairline} />

        <ellipse cx="352" cy="382" rx="9" ry="3" className={s.fillShadow} />
        <path d="M352 360 C 346 366 342 374 344 380 C 346 386 358 386 360 380 C 362 374 358 366 352 360 Z" className={s.fillCanvas} />
        <path d="M352 360 C 352 354 355 352 357 354" className={s.nearLine} />
        <path d="M357 354 C 361 352 363 356 361 358 Z" className={s.fillFoliage} />

        <ellipse cx="376" cy="382" rx="10" ry="3" className={s.fillShadow} />
        <path d="M386 374 C 380 370 372 370 368 376 C 364 382 372 386 380 384 C 386 382 390 376 386 374 Z" className={s.fillCanvas} />
        <path d="M386 374 C 392 374 394 372 396 374" className={s.nearLine} />

        <circle cx="316" cy="384" r="2" className={s.fillCanvas} />
        <circle cx="398" cy="384" r="2.5" className={s.hairline} />
      
        <path d="M14 392 L18 374 M20 392 L22 378 M26 392 L24 376" className={s.nearLine} />
        <path d="M48 396 L52 376 M54 396 L57 382 M60 396 L58 378" className={s.nearLine} />
        <path d="M86 390 L90 372 M93 390 L95 378 M98 390 L96 374" className={s.nearLine} />
        <path d="M536 392 L540 372 M543 392 L546 378 M549 392 L548 374" className={s.nearLine} />
        <path d="M574 396 L578 376 M580 396 L583 382 M586 396 L584 378" className={s.nearLine} />
        <path d="M608 398 L612 376 M614 398 L617 382 M620 398 L618 374" className={s.nearLine} />
        <circle cx="112" cy="386" r="2.5" className={s.hairline} />
        <circle cx="126" cy="392" r="2" className={s.hairline} />
        <circle cx="496" cy="388" r="2.5" className={s.hairline} />
        <circle cx="510" cy="394" r="1.75" className={s.hairline} />
      </g>
    </>
  ),

  'market-closed': (s) => (
    <>

      
      {/* ── 1 · SKY ─────────────────────────────────────────────── */}
      <g data-layer="sky" className={s.drift}>
        <path d="M106 62 L114 56 L122 62" className={s.birdLine} />
        <path d="M138 48 L145 43 L152 48" className={s.birdLine} />
        <path d="M166 68 L172 63 L178 68" className={s.birdLine} />
        <path d="M486 54 L493 48 L500 54" className={s.birdLine} />
        <path d="M510 66 L516 61 L522 66" className={s.birdLine} />
        <path d="M536 50 L543 44 L550 50" className={s.birdLine} />
      </g>

      {/* ── 2 · FAR HILLS ───────────────────────────────────────── */}
      <g data-layer="far-hills">
        <path d="M-12 252 C 44 212 128 202 198 226 C 248 244 288 252 324 252 Z" className={s.fillCanvasSoft} />
        <path d="M284 252 C 348 214 436 204 510 228 C 566 247 612 252 652 252 Z" className={s.fillCanvasSoft} />
        <path d="M112 250 C 158 224 226 218 286 240" className={s.farLine} />
        <path d="M352 244 C 402 222 458 218 504 232" className={s.farLine} />
        <path d="M40 252 C 86 230 148 226 202 244" className={s.farLine} />
        <path d="M440 248 C 490 228 546 226 596 240" className={s.farLine} />
      </g>

      {/* ── 3 · FOREST BAND ─────────────────────────────────────── */}
      <g data-layer="forest-band">
        <path
          d="M-10 252
             C 8 226 34 218 50 230 C 62 210 92 206 106 224
             C 122 204 152 206 162 226 C 178 208 206 210 216 230
             C 232 212 258 214 268 232 C 284 214 310 216 320 234
             C 336 216 362 216 372 234 C 388 214 414 214 426 232
             C 442 210 470 212 482 230 C 498 208 526 210 538 228
             C 552 208 582 206 594 226 C 608 214 632 218 650 236
             L 650 252 Z"
          className={s.fillForest}
        />
        <path d="M22 252 L22 234" className={s.forestLine} />
        <path d="M68 252 L68 230" className={s.forestLine} />
        <path d="M110 252 L110 228" className={s.forestLine} />
        <path d="M152 252 L152 232" className={s.forestLine} />
        <path d="M196 252 L196 234" className={s.forestLine} />
        <path d="M240 252 L240 236" className={s.forestLine} />
        <path d="M284 252 L284 238" className={s.forestLine} />
        <path d="M326 252 L326 238" className={s.forestLine} />
        <path d="M368 252 L368 238" className={s.forestLine} />
        <path d="M410 252 L410 236" className={s.forestLine} />
        <path d="M452 252 L452 234" className={s.forestLine} />
        <path d="M494 252 L494 232" className={s.forestLine} />
        <path d="M536 252 L536 232" className={s.forestLine} />
        <path d="M578 252 L578 230" className={s.forestLine} />
        <path d="M618 252 L618 234" className={s.forestLine} />
      </g>

      {/* ── 4 · MID TREES (bare branches) ───────────────────────── */}
      <g data-layer="mid-trees">
        <path d="M72 262 L76 196 L82 196 L86 262 Z" className={s.trunk} />
        <path d="M78 196 L62 166" className={s.woodLine} />
        <path d="M62 166 L52 146" className={s.woodLine} />
        <path d="M62 166 L72 150" className={s.woodLine} />
        <path d="M80 196 L98 168" className={s.woodLine} />
        <path d="M98 168 L110 152" className={s.woodLine} />
        <path d="M110 152 L116 142" className={s.woodLine} />
        <path d="M98 168 L90 148" className={s.woodLine} />
        <path d="M62 166 L52 146" className={s.woodLine} />
        <path d="M52 146 L46 136" className={s.woodLine} />
        <path d="M77 218 L58 204" className={s.woodLine} />
        <path d="M58 204 L48 196" className={s.woodLine} />
        <path d="M81 222 L102 208" className={s.woodLine} />
        <path d="M102 208 L112 202" className={s.woodLine} />
        <path d="M580 258 L583 222 L588 222 L592 258 Z" className={s.trunk} />
        <ellipse cx="570" cy="214" rx="18" ry="14" className={s.fillFoliage} />
        <ellipse cx="596" cy="206" rx="20" ry="15" className={s.fillFoliage} />
        <ellipse cx="582" cy="194" rx="16" ry="13" className={s.fillFoliage} />
        <ellipse cx="610" cy="216" rx="14" ry="11" className={s.fillFoliage} />
      </g>

      {/* ── 5 · GROUND ──────────────────────────────────────────── */}
      <g data-layer="ground">
        <line x1="0" y1="252" x2="640" y2="252" className={s.horizon} />
        <path d="M0 266 C 90 260 180 264 260 260" className={s.hairline} />
        <path d="M380 260 C 470 264 560 260 640 266" className={s.hairline} />
        <path d="M0 280 C 100 274 190 278 280 274" className={s.hairline} />
      </g>

      {/* ── 6 · ROAD ────────────────────────────────────────────── */}
      <g data-layer="road">
        <path d="M30 400 C 130 370 260 330 380 306 L 460 306 C 420 330 340 366 260 400 Z" className={s.fillCanvasSoft} />
        <path d="M30 400 C 130 370 260 330 380 306" className={s.roadLine} />
        <path d="M260 400 C 340 366 420 330 460 306" className={s.roadLine} />
        <path d="M110 400 C 190 366 300 330 396 308" className={s.rut} />
        <path d="M180 400 C 250 366 340 330 420 308" className={s.rut} />
        <circle cx="150" cy="376" r="2.5" className={s.hairline} />
        <circle cx="180" cy="384" r="2" className={s.hairline} />
        <circle cx="220" cy="356" r="2" className={s.hairline} />
        <circle cx="280" cy="342" r="2.5" className={s.hairline} />
        <circle cx="310" cy="336" r="2" className={s.hairline} />
        <circle cx="340" cy="330" r="1.75" className={s.hairline} />
      </g>
      <g data-layer="structures">
        {/* Receding fence on left */}
        <path d="M8 340 L8 298" className={s.woodLine} />
        <path d="M36 336 L36 295" className={s.woodLine} />
        <path d="M62 332 L62 292" className={s.woodLine} />
        <path d="M86 328 L86 289" className={s.woodLine} />
        <path d="M108 324 L108 286" className={s.woodLine} />
        <path d="M128 320 L128 284" className={s.woodLine} />
        <path d="M146 316 L146 282" className={s.woodLine} />
        <path d="M162 312 L162 280" className={s.woodLine} />
        <path d="M6 310 C 60 300 120 290 164 282" className={s.woodLine} />
        <path d="M6 324 C 60 314 120 304 164 294" className={s.woodLine} />

        {/* Closed market stall */}
        <path d="M390 310 L390 190" className={s.woodLine} />
        <path d="M570 310 L570 190" className={s.woodLine} />
        <line x1="380" y1="190" x2="580" y2="190" className={s.woodLine} />

        {/* Rolled & tied awning */}
        <ellipse cx="480" cy="190" rx="95" ry="8" className={s.fillCloth} />
        <line x1="410" y1="182" x2="410" y2="198" className={s.woodLine} />
        <line x1="450" y1="182" x2="450" y2="198" className={s.woodLine} />
        <line x1="480" y1="182" x2="480" y2="198" className={s.woodLine} />
        <line x1="510" y1="182" x2="510" y2="198" className={s.woodLine} />
        <line x1="550" y1="182" x2="550" y2="198" className={s.woodLine} />

        {/* Sign bracket */}
        <line x1="390" y1="210" x2="350" y2="210" className={s.woodLine} />
        <line x1="360" y1="210" x2="360" y2="220" className={s.woodLine} />
        <line x1="380" y1="210" x2="380" y2="220" className={s.woodLine} />

        {/* ACCENT: The small hanging sign in carrot */}
        <path d="M352 220 L388 220 L388 238 L352 238 Z" className={s.accentCarrot} />
        <line x1="358" y1="226" x2="382" y2="226" className={s.hairline} />
        <line x1="362" y1="232" x2="378" y2="232" className={s.hairline} />

        <path d="M396 264 L564 264 L564 274 L396 274 Z" className={s.fillWood} />

        {/* Stacked upside down empty crates */}
        <path d="M404 274 L454 274 L454 310 L404 310 Z" className={s.fillCanvas} />
        <line x1="404" y1="286" x2="454" y2="286" className={s.woodLine} />
        <line x1="404" y1="298" x2="454" y2="298" className={s.woodLine} />
        <line x1="412" y1="274" x2="412" y2="310" className={s.hairline} />
        <line x1="446" y1="274" x2="446" y2="310" className={s.hairline} />

        <path d="M408 238 L450 238 L450 274 L408 274 Z" className={s.fillCanvas} />
        <line x1="408" y1="250" x2="450" y2="250" className={s.woodLine} />
        <line x1="408" y1="262" x2="450" y2="262" className={s.woodLine} />
        <line x1="414" y1="238" x2="414" y2="274" className={s.hairline} />
        <line x1="444" y1="238" x2="444" y2="274" className={s.hairline} />

        <path d="M504 274 L554 274 L554 310 L504 310 Z" className={s.fillCanvas} />
        <line x1="504" y1="286" x2="554" y2="286" className={s.woodLine} />
        <line x1="504" y1="298" x2="554" y2="298" className={s.woodLine} />
        <line x1="512" y1="274" x2="512" y2="310" className={s.hairline} />
        <line x1="546" y1="274" x2="546" y2="310" className={s.hairline} />

        {/* Long hairline cast shadows */}
        <ellipse cx="340" cy="312" rx="60" ry="3" className={s.fillShadow} />
        <ellipse cx="440" cy="312" rx="70" ry="3" className={s.fillShadow} />
        <ellipse cx="530" cy="312" rx="60" ry="3" className={s.fillShadow} />
        <ellipse cx="140" cy="264" rx="55" ry="3" className={s.fillShadow} />
        <ellipse cx="200" cy="290" rx="45" ry="2.5" className={s.fillShadow} />
        <ellipse cx="490" cy="318" rx="50" ry="2.5" className={s.fillShadow} />
      </g>
      <g data-layer="figures">
        <line x1="260" y1="280" x2="260" y2="260" className={s.woodLine} />
        <circle cx="260" cy="256" r="3" className={s.figureLine} />
        <ellipse cx="260" cy="281" rx="6" ry="1.5" className={s.fillShadow} />
      </g>
      
      {/* ── 9 · FOREGROUND ──────────────────────────────────────── */}
      <g data-layer="foreground">
        
        {/* Fallen bare leaf lines on ground */}
        <path d="M290 350 L296 354" className={s.hairline} />
        <path d="M380 340 L386 344" className={s.hairline} />
      
        <path d="M14 392 L18 374 M20 392 L22 378 M26 392 L24 376" className={s.nearLine} />
        <path d="M48 396 L52 376 M54 396 L57 382 M60 396 L58 378" className={s.nearLine} />
        <path d="M86 390 L90 372 M93 390 L95 378 M98 390 L96 374" className={s.nearLine} />
        <path d="M536 392 L540 372 M543 392 L546 378 M549 392 L548 374" className={s.nearLine} />
        <path d="M574 396 L578 376 M580 396 L583 382 M586 396 L584 378" className={s.nearLine} />
        <path d="M608 398 L612 376 M614 398 L617 382 M620 398 L618 374" className={s.nearLine} />
        <circle cx="112" cy="386" r="2.5" className={s.hairline} />
        <circle cx="126" cy="392" r="2" className={s.hairline} />
        <circle cx="496" cy="388" r="2.5" className={s.hairline} />
        <circle cx="510" cy="394" r="1.75" className={s.hairline} />
      </g>
    </>
  ),

  'stall-empty': (s) => (
    <>

      
      {/* ── 1 · SKY ─────────────────────────────────────────────── */}
      <g data-layer="sky" className={s.drift}>
        <path d="M106 62 L114 56 L122 62" className={s.birdLine} />
        <path d="M138 48 L145 43 L152 48" className={s.birdLine} />
        <path d="M166 68 L172 63 L178 68" className={s.birdLine} />
        <path d="M486 54 L493 48 L500 54" className={s.birdLine} />
        <path d="M510 66 L516 61 L522 66" className={s.birdLine} />
        <path d="M536 50 L543 44 L550 50" className={s.birdLine} />
      </g>

      {/* ── 2 · FAR HILLS ───────────────────────────────────────── */}
      <g data-layer="far-hills">
        <path d="M-12 252 C 44 212 128 202 198 226 C 248 244 288 252 324 252 Z" className={s.fillCanvasSoft} />
        <path d="M284 252 C 348 214 436 204 510 228 C 566 247 612 252 652 252 Z" className={s.fillCanvasSoft} />
        <path d="M112 250 C 158 224 226 218 286 240" className={s.farLine} />
        <path d="M352 244 C 402 222 458 218 504 232" className={s.farLine} />
        <path d="M40 252 C 86 230 148 226 202 244" className={s.farLine} />
        <path d="M440 248 C 490 228 546 226 596 240" className={s.farLine} />
      </g>

      {/* ── 3 · FOREST BAND ─────────────────────────────────────── */}
      <g data-layer="forest-band">
        <path
          d="M-10 252
             C 8 226 34 218 50 230 C 62 210 92 206 106 224
             C 122 204 152 206 162 226 C 178 208 206 210 216 230
             C 232 212 258 214 268 232 C 284 214 310 216 320 234
             C 336 216 362 216 372 234 C 388 214 414 214 426 232
             C 442 210 470 212 482 230 C 498 208 526 210 538 228
             C 552 208 582 206 594 226 C 608 214 632 218 650 236
             L 650 252 Z"
          className={s.fillForest}
        />
        <path d="M22 252 L22 234" className={s.forestLine} />
        <path d="M68 252 L68 230" className={s.forestLine} />
        <path d="M110 252 L110 228" className={s.forestLine} />
        <path d="M152 252 L152 232" className={s.forestLine} />
        <path d="M196 252 L196 234" className={s.forestLine} />
        <path d="M240 252 L240 236" className={s.forestLine} />
        <path d="M284 252 L284 238" className={s.forestLine} />
        <path d="M326 252 L326 238" className={s.forestLine} />
        <path d="M368 252 L368 238" className={s.forestLine} />
        <path d="M410 252 L410 236" className={s.forestLine} />
        <path d="M452 252 L452 234" className={s.forestLine} />
        <path d="M494 252 L494 232" className={s.forestLine} />
        <path d="M536 252 L536 232" className={s.forestLine} />
        <path d="M578 252 L578 230" className={s.forestLine} />
        <path d="M618 252 L618 234" className={s.forestLine} />
      </g>

      {/* ── 4 · MID TREES ───────────────────────────────────────── */}
      <g data-layer="mid-trees">
        <path d="M54 260 L58 214 L64 214 L69 260 Z" className={s.trunk} />
        <path d="M58 228 L44 214" className={s.foliageLine} />
        <path d="M64 232 L78 216" className={s.foliageLine} />
        <ellipse cx="42" cy="204" rx="21" ry="16" className={s.fillFoliage} />
        <ellipse cx="72" cy="196" rx="23" ry="18" className={s.fillFoliage} />
        <ellipse cx="56" cy="182" rx="20" ry="15" className={s.fillFoliage} />
        <ellipse cx="86" cy="210" rx="17" ry="13" className={s.fillFoliage} />
        <ellipse cx="34" cy="218" rx="15" ry="11" className={s.fillFoliage} />

        <path d="M574 258 L577 220 L582 220 L586 258 Z" className={s.trunk} />
        <path d="M577 232 L566 220" className={s.foliageLine} />
        <ellipse cx="564" cy="212" rx="19" ry="14" className={s.fillFoliage} />
        <ellipse cx="590" cy="204" rx="21" ry="15" className={s.fillFoliage} />
        <ellipse cx="576" cy="192" rx="17" ry="12" className={s.fillFoliage} />

        <path d="M620 256 L623 224 L627 224 L630 256 Z" className={s.trunk} />
        <ellipse cx="614" cy="216" rx="16" ry="12" className={s.fillFoliage} />
        <ellipse cx="632" cy="210" rx="17" ry="13" className={s.fillFoliage} />
      </g>

      {/* ── 5 · GROUND ──────────────────────────────────────────── */}
      <g data-layer="ground">
        <line x1="0" y1="252" x2="640" y2="252" className={s.horizon} />
        <path d="M0 266 C 90 260 180 264 260 260" className={s.hairline} />
        <path d="M380 260 C 470 264 560 260 640 266" className={s.hairline} />
        <path d="M0 280 C 100 274 190 278 280 274" className={s.hairline} />
      </g>

      {/* ── 6 · ROAD ────────────────────────────────────────────── */}
      <g data-layer="road">
        <path d="M30 400 C 130 370 260 330 380 306 L 460 306 C 420 330 340 366 260 400 Z" className={s.fillCanvasSoft} />
        <path d="M30 400 C 130 370 260 330 380 306" className={s.roadLine} />
        <path d="M260 400 C 340 366 420 330 460 306" className={s.roadLine} />
        <path d="M110 400 C 190 366 300 330 396 308" className={s.rut} />
        <path d="M180 400 C 250 366 340 330 420 308" className={s.rut} />
        <circle cx="150" cy="376" r="2.5" className={s.hairline} />
        <circle cx="220" cy="356" r="2" className={s.hairline} />
        <circle cx="280" cy="342" r="2.5" className={s.hairline} />
        <circle cx="340" cy="330" r="1.75" className={s.hairline} />
      </g>
      <g data-layer="structures">
        <path d="M150 340 L150 180" className={s.woodLine} />
        <path d="M510 340 L510 180" className={s.woodLine} />
        <path d="M138 174 C 230 148 430 148 522 174 L 522 186 C 430 162 230 162 138 186 Z" className={s.fillWhite} />
        <path d="M138 186 C 152 196 168 196 182 186" className={s.woodLine} />
        <path d="M182 186 C 196 196 212 196 226 186" className={s.woodLine} />
        <path d="M226 186 C 240 196 256 196 270 186" className={s.woodLine} />
        <path d="M270 186 C 284 196 300 196 314 186" className={s.woodLine} />
        <path d="M314 186 C 328 196 344 196 358 186" className={s.woodLine} />
        <path d="M358 186 C 372 196 388 196 402 186" className={s.woodLine} />
        <path d="M402 186 C 416 196 432 196 446 186" className={s.woodLine} />
        <path d="M446 186 C 460 196 476 196 490 186" className={s.woodLine} />
        <path d="M490 186 C 504 196 514 196 522 186" className={s.woodLine} />

        <path d="M154 270 L506 270 L506 282 L154 282 Z" className={s.fillWood} />
        <line x1="154" y1="276" x2="506" y2="276" className={s.hairline} />

        <path d="M168 268 L240 268 L244 316 L164 312 Z" className={s.fillCloth} />
        <path d="M164 312 C 184 320 220 320 244 316" className={s.woodLine} />
        {/* ACCENT: The cloth stripe in carrot */}
        <line x1="184" y1="268" x2="182" y2="314" className={s.accentCarrot} />

        {/* Stack of empty crates */}
        <path d="M424 282 L484 282 L484 336 L424 336 Z" className={s.fillCanvas} />
        <line x1="424" y1="298" x2="484" y2="298" className={s.woodLine} />
        <line x1="424" y1="316" x2="484" y2="316" className={s.woodLine} />
        <line x1="432" y1="282" x2="432" y2="336" className={s.hairline} />
        <line x1="476" y1="282" x2="476" y2="336" className={s.hairline} />
        <line x1="438" y1="290" x2="470" y2="290" className={s.hairline} />

        <path d="M428 234 L480 234 L480 270 L428 270 Z" className={s.fillCanvas} />
        <line x1="428" y1="246" x2="480" y2="246" className={s.woodLine} />
        <line x1="428" y1="258" x2="480" y2="258" className={s.woodLine} />
        <line x1="436" y1="234" x2="436" y2="270" className={s.hairline} />
        <line x1="472" y1="234" x2="472" y2="270" className={s.hairline} />
        <line x1="442" y1="252" x2="466" y2="252" className={s.hairline} />

        <path d="M432 198 L476 198 L476 234 L432 234 Z" className={s.fillCanvas} />
        <line x1="432" y1="210" x2="476" y2="210" className={s.woodLine} />
        <line x1="432" y1="222" x2="476" y2="222" className={s.woodLine} />
        <line x1="440" y1="198" x2="440" y2="234" className={s.hairline} />
        <line x1="468" y1="198" x2="468" y2="234" className={s.hairline} />

        {/* Trestle diagonal struts */}
        <line x1="154" y1="282" x2="186" y2="340" className={s.woodLine} />
        <line x1="506" y1="282" x2="474" y2="340" className={s.woodLine} />

        {/* Crate stack shadow */}
        <ellipse cx="454" cy="337" rx="32" ry="3.5" className={s.fillShadow} />

        {/* Leaning broom */}
        <line x1="140" y1="338" x2="160" y2="236" className={s.woodLine} />
        <path d="M136 338 L144 338 L140 324 Z" className={s.fillCanvas} />
        <line x1="138" y1="338" x2="138" y2="324" className={s.hairline} />
        {/* Broom bristle details and shadow */}
        <ellipse cx="138" cy="340" rx="8" ry="2" className={s.fillShadow} />
        <line x1="137" y1="332" x2="137" y2="338" className={s.hairline} />
        <line x1="143" y1="332" x2="143" y2="338" className={s.hairline} />
        {/* Crate corner plates */}
        <path d="M424 282 L432 282 L424 290 Z" className={s.fillWood} />
        <path d="M484 282 L476 282 L484 290 Z" className={s.fillWood} />
        <path d="M424 336 L432 336 L424 328 Z" className={s.fillWood} />
        <path d="M484 336 L476 336 L484 328 Z" className={s.fillWood} />
        <circle cx="218" cy="378" r="2.5" className={s.hairline} />
        <circle cx="236" cy="382" r="2" className={s.hairline} />

        {/* Empty basket on ground */}
        <ellipse cx="294" cy="331" rx="30" ry="3" className={s.fillShadow} />
        <path d="M260 300 C 260 274 328 274 328 300" className={s.nearLine} />
        <path d="M260 300 C 258 322 270 330 294 330 C 318 330 330 322 328 300 Z" className={s.fillCanvas} />
        <ellipse cx="294" cy="300" rx="34" ry="7" className={s.nearLine} />
        <path d="M268 304 C 274 316 284 326 294 330" className={s.hairline} />
        <path d="M280 304 C 284 316 288 326 294 330" className={s.hairline} />
        <path d="M308 304 C 304 316 300 326 294 330" className={s.hairline} />
        <path d="M320 304 C 314 316 304 326 294 330" className={s.hairline} />
      </g>
      <g data-layer="figures">
        <ellipse cx="360" cy="286" rx="16" ry="3" className={s.fillShadow} />
        <circle cx="360" cy="216" r="8.5" className={s.figureLine} />
        <path d="M350 226 C 346 238 344 252 346 268 L 374 268 C 376 252 374 238 370 226 Z" className={s.figureLine} />
        <path d="M352 238 L368 238 L370 268 L350 268 Z" className={s.fillWhite} />
        <path d="M348 234 L372 230" className={s.figureLine} />
        <path d="M368 234 L388 230" className={s.figureLine} />
        <path d="M368 220 L402 216 L404 234 L370 238 Z" className={s.fillCanvas} />
        <line x1="369" y1="229" x2="403" y2="225" className={s.woodLine} />
        <line x1="374" y1="220" x2="374" y2="238" className={s.hairline} />
        <line x1="396" y1="218" x2="396" y2="236" className={s.hairline} />
      </g>
      
      {/* ── 9 · FOREGROUND ──────────────────────────────────────── */}
      <g data-layer="foreground">
        
        <path d="M14 392 L18 374 M20 392 L22 378 M26 392 L24 376" className={s.nearLine} />
        <path d="M48 396 L52 376 M54 396 L57 382 M60 396 L58 378" className={s.nearLine} />
        <path d="M86 390 L90 372 M93 390 L95 378 M98 390 L96 374" className={s.nearLine} />
        <path d="M536 392 L540 372 M543 392 L546 378 M549 392 L548 374" className={s.nearLine} />
        <path d="M574 396 L578 376 M580 396 L583 382 M586 396 L584 378" className={s.nearLine} />
        <path d="M608 398 L612 376 M614 398 L617 382 M620 398 L618 374" className={s.nearLine} />
        <circle cx="112" cy="386" r="2.5" className={s.hairline} />
        <circle cx="126" cy="392" r="2" className={s.hairline} />
        <circle cx="496" cy="388" r="2.5" className={s.hairline} />
        <circle cx="510" cy="394" r="1.75" className={s.hairline} />
      </g>
    </>
  ),

  'no-notifications': (s) => (
    <>

      
      {/* ── 1 · SKY ─────────────────────────────────────────────── */}
      <g data-layer="sky" className={s.drift}>
        <path d="M106 62 L114 56 L122 62" className={s.birdLine} />
        <path d="M138 48 L145 43 L152 48" className={s.birdLine} />
        <path d="M166 68 L172 63 L178 68" className={s.birdLine} />
        <path d="M486 54 L493 48 L500 54" className={s.birdLine} />
        <path d="M510 66 L516 61 L522 66" className={s.birdLine} />
        <path d="M536 50 L543 44 L550 50" className={s.birdLine} />
      </g>

      {/* ── 2 · FAR HILLS ───────────────────────────────────────── */}
      <g data-layer="far-hills">
        <path d="M-12 252 C 44 212 128 202 198 226 C 248 244 288 252 324 252 Z" className={s.fillCanvasSoft} />
        <path d="M284 252 C 348 214 436 204 510 228 C 566 247 612 252 652 252 Z" className={s.fillCanvasSoft} />
        <path d="M112 250 C 158 224 226 218 286 240" className={s.farLine} />
        <path d="M352 244 C 402 222 458 218 504 232" className={s.farLine} />
        <path d="M40 252 C 86 230 148 226 202 244" className={s.farLine} />
        <path d="M440 248 C 490 228 546 226 596 240" className={s.farLine} />
      </g>

      {/* ── 3 · FOREST BAND ─────────────────────────────────────── */}
      <g data-layer="forest-band">
        <path
          d="M-10 252
             C 8 226 34 218 50 230 C 62 210 92 206 106 224
             C 122 204 152 206 162 226 C 178 208 206 210 216 230
             C 232 212 258 214 268 232 C 284 214 310 216 320 234
             C 336 216 362 216 372 234 C 388 214 414 214 426 232
             C 442 210 470 212 482 230 C 498 208 526 210 538 228
             C 552 208 582 206 594 226 C 608 214 632 218 650 236
             L 650 252 Z"
          className={s.fillForest}
        />
        <path d="M22 252 L22 234" className={s.forestLine} />
        <path d="M68 252 L68 230" className={s.forestLine} />
        <path d="M110 252 L110 228" className={s.forestLine} />
        <path d="M152 252 L152 232" className={s.forestLine} />
        <path d="M196 252 L196 234" className={s.forestLine} />
        <path d="M240 252 L240 236" className={s.forestLine} />
        <path d="M284 252 L284 238" className={s.forestLine} />
        <path d="M326 252 L326 238" className={s.forestLine} />
        <path d="M368 252 L368 238" className={s.forestLine} />
        <path d="M410 252 L410 236" className={s.forestLine} />
        <path d="M452 252 L452 234" className={s.forestLine} />
        <path d="M494 252 L494 232" className={s.forestLine} />
        <path d="M536 252 L536 232" className={s.forestLine} />
        <path d="M578 252 L578 230" className={s.forestLine} />
        <path d="M618 252 L618 234" className={s.forestLine} />
      </g>

      {/* ── 4 · MID TREES ───────────────────────────────────────── */}
      <g data-layer="mid-trees">
        <path d="M54 260 L58 214 L64 214 L69 260 Z" className={s.trunk} />
        <path d="M58 228 L44 214" className={s.foliageLine} />
        <path d="M64 232 L78 216" className={s.foliageLine} />
        <ellipse cx="42" cy="204" rx="21" ry="16" className={s.fillFoliage} />
        <ellipse cx="72" cy="196" rx="23" ry="18" className={s.fillFoliage} />
        <ellipse cx="56" cy="182" rx="20" ry="15" className={s.fillFoliage} />
        <ellipse cx="86" cy="210" rx="17" ry="13" className={s.fillFoliage} />
        <ellipse cx="34" cy="218" rx="15" ry="11" className={s.fillFoliage} />

        <path d="M574 258 L577 220 L582 220 L586 258 Z" className={s.trunk} />
        <path d="M577 232 L566 220" className={s.foliageLine} />
        <ellipse cx="564" cy="212" rx="19" ry="14" className={s.fillFoliage} />
        <ellipse cx="590" cy="204" rx="21" ry="15" className={s.fillFoliage} />
        <ellipse cx="576" cy="192" rx="17" ry="12" className={s.fillFoliage} />

        <path d="M620 256 L623 224 L627 224 L630 256 Z" className={s.trunk} />
        <ellipse cx="614" cy="216" rx="16" ry="12" className={s.fillFoliage} />
        <ellipse cx="632" cy="210" rx="17" ry="13" className={s.fillFoliage} />
      </g>

      {/* ── 5 · GROUND ──────────────────────────────────────────── */}
      <g data-layer="ground">
        <line x1="0" y1="252" x2="640" y2="252" className={s.horizon} />
        <path d="M0 266 C 90 260 180 264 260 260" className={s.hairline} />
        <path d="M380 260 C 470 264 560 260 640 266" className={s.hairline} />
        <path d="M0 280 C 100 274 190 278 280 274" className={s.hairline} />
      </g>

      {/* ── 6 · ROAD ────────────────────────────────────────────── */}
      <g data-layer="road">
        <path d="M30 400 C 130 370 260 330 380 306 L 460 306 C 420 330 340 366 260 400 Z" className={s.fillCanvasSoft} />
        <path d="M30 400 C 130 370 260 330 380 306" className={s.roadLine} />
        <path d="M260 400 C 340 366 420 330 460 306" className={s.roadLine} />
        <path d="M110 400 C 190 366 300 330 396 308" className={s.rut} />
        <path d="M180 400 C 250 366 340 330 420 308" className={s.rut} />
        <circle cx="150" cy="376" r="2.5" className={s.hairline} />
        <circle cx="220" cy="356" r="2" className={s.hairline} />
        <circle cx="280" cy="342" r="2.5" className={s.hairline} />
        <circle cx="340" cy="330" r="1.75" className={s.hairline} />
      </g>
      <g data-layer="structures">
        {/* Overhead wire and birds */}
        <path d="M0 110 C 200 130 440 130 640 110" className={s.hairline} />
        <circle cx="310" cy="120" r="3.5" className={s.birdLine} />
        <circle cx="320" cy="121" r="3.5" className={s.birdLine} />
        <circle cx="334" cy="122" r="3.5" className={s.birdLine} />

        {/* Noticeboard posts */}
        <ellipse cx="230" cy="336" rx="14" ry="3" className={s.fillShadow} />
        <ellipse cx="410" cy="336" rx="14" ry="3" className={s.fillShadow} />
        <path d="M224 334 L228 170 L236 170 L232 334 Z" className={s.woodLine} />
        <path d="M404 334 L408 170 L416 170 L412 334 Z" className={s.woodLine} />

        {/* Shingled roof */}
        <polygon points="190,172 320,146 450,172" className={s.fillWood} />
        <line x1="200" y1="170" x2="440" y2="170" className={s.woodLine} />
        <line x1="240" y1="162" x2="244" y2="170" className={s.hairline} />
        <line x1="280" y1="154" x2="284" y2="170" className={s.hairline} />
        <line x1="320" y1="146" x2="320" y2="170" className={s.hairline} />
        <line x1="360" y1="154" x2="356" y2="170" className={s.hairline} />
        <line x1="400" y1="162" x2="396" y2="170" className={s.hairline} />
        <line x1="210" y1="178" x2="228" y2="178" className={s.hairline} />
        <line x1="412" y1="178" x2="430" y2="178" className={s.hairline} />

        {/* Board frame and backing planks */}
        <path d="M204 172 L436 172 L436 288 L204 288 Z" className={s.fillWood} />
        <path d="M212 180 L428 180 L428 280 L212 280 Z" className={s.fillCanvas} />
        <line x1="212" y1="200" x2="428" y2="200" className={s.hairline} />
        <line x1="212" y1="220" x2="428" y2="220" className={s.hairline} />
        <line x1="212" y1="240" x2="428" y2="240" className={s.hairline} />
        <line x1="212" y1="260" x2="428" y2="260" className={s.hairline} />

        {/* One blank pinned note */}
        <path d="M288 204 L352 204 L352 258 L288 258 Z" className={s.fillWhite} />
        <line x1="296" y1="218" x2="344" y2="218" className={s.hairline} />
        <line x1="296" y1="228" x2="338" y2="228" className={s.hairline} />
        <line x1="296" y1="238" x2="330" y2="238" className={s.hairline} />

        {/* Older pinned notice on side */}
        <path d="M228 214 L264 214 L264 246 L228 246 Z" className={s.fillCanvasSoft} />
        <line x1="232" y1="224" x2="260" y2="224" className={s.hairline} />
        <line x1="232" y1="232" x2="254" y2="232" className={s.hairline} />
        <circle cx="246" cy="218" r="2" className={s.hairline} />
        {/* 4th bird on wire */}
        <circle cx="348" cy="123" r="3.5" className={s.birdLine} />
        <path d="M348 126 L349 129" className={s.birdLine} />
        {/* Older memo on right side */}
        <path d="M374 210 L414 210 L414 250 L374 250 Z" className={s.fillCanvasSoft} />
        <line x1="380" y1="222" x2="408" y2="222" className={s.hairline} />
        <line x1="380" y1="232" x2="404" y2="232" className={s.hairline} />
        <circle cx="394" cy="214" r="2" className={s.hairline} />
        {/* Extra fence posts & stones */}
        <path d="M176 310 L176 280" className={s.woodLine} />
        <path d="M202 304 L202 276" className={s.woodLine} />
        <circle cx="218" cy="342" r="2.5" className={s.hairline} />
        <circle cx="242" cy="346" r="2" className={s.hairline} />
        <circle cx="398" cy="344" r="2" className={s.hairline} />
        <circle cx="424" cy="342" r="2.5" className={s.hairline} />

        {/* ACCENT: The pushpin in beet */}
        <circle cx="320" cy="208" r="4" className={s.accentBeetFill} />

        {/* Fence posts receding on left */}
        <path d="M12 340 L12 300" className={s.woodLine} />
        <path d="M50 334 L50 296" className={s.woodLine} />
        <path d="M86 328 L86 292" className={s.woodLine} />
        <path d="M118 322 L118 288" className={s.woodLine} />
        <path d="M148 316 L148 284" className={s.woodLine} />
        <path d="M10 310 C 60 304 110 298 150 292" className={s.woodLine} />
        <path d="M10 326 C 60 318 110 312 150 306" className={s.woodLine} />
      </g>
      <g data-layer="figures">
        <ellipse cx="480" cy="308" rx="8" ry="2" className={s.fillShadow} />
        <circle cx="480" cy="276" r="5" className={s.figureLine} />
        <path d="M480 281 L476 298 L484 298 Z" className={s.figureLine} />
        <path d="M477 298 L476 306" className={s.figureLine} />
        <path d="M483 298 L484 306" className={s.figureLine} />
      </g>
      
      {/* ── 9 · FOREGROUND ──────────────────────────────────────── */}
      <g data-layer="foreground">
        
        {/* Wildflower stalks beside board */}
        <line x1="190" y1="360" x2="190" y2="340" className={s.hairline} />
        <circle cx="190" cy="338" r="2" className={s.hairline} />
        <line x1="440" y1="360" x2="442" y2="338" className={s.hairline} />
        <circle cx="442" cy="336" r="2" className={s.hairline} />
      
        <path d="M14 392 L18 374 M20 392 L22 378 M26 392 L24 376" className={s.nearLine} />
        <path d="M48 396 L52 376 M54 396 L57 382 M60 396 L58 378" className={s.nearLine} />
        <path d="M86 390 L90 372 M93 390 L95 378 M98 390 L96 374" className={s.nearLine} />
        <path d="M536 392 L540 372 M543 392 L546 378 M549 392 L548 374" className={s.nearLine} />
        <path d="M574 396 L578 376 M580 396 L583 382 M586 396 L584 378" className={s.nearLine} />
        <path d="M608 398 L612 376 M614 398 L617 382 M620 398 L618 374" className={s.nearLine} />
        <circle cx="112" cy="386" r="2.5" className={s.hairline} />
        <circle cx="126" cy="392" r="2" className={s.hairline} />
        <circle cx="496" cy="388" r="2.5" className={s.hairline} />
        <circle cx="510" cy="394" r="1.75" className={s.hairline} />
      </g>
    </>
  ),

  'lost-path': (s) => (
    <>

      
      {/* ── 1 · SKY ─────────────────────────────────────────────── */}
      <g data-layer="sky" className={s.drift}>
        <path d="M106 62 L114 56 L122 62" className={s.birdLine} />
        <path d="M138 48 L145 43 L152 48" className={s.birdLine} />
        <path d="M166 68 L172 63 L178 68" className={s.birdLine} />
        <path d="M486 54 L493 48 L500 54" className={s.birdLine} />
        <path d="M510 66 L516 61 L522 66" className={s.birdLine} />
        <path d="M536 50 L543 44 L550 50" className={s.birdLine} />
      </g>

      {/* ── 2 · FAR HILLS ───────────────────────────────────────── */}
      <g data-layer="far-hills">
        <path d="M-12 252 C 44 212 128 202 198 226 C 248 244 288 252 324 252 Z" className={s.fillCanvasSoft} />
        <path d="M284 252 C 348 214 436 204 510 228 C 566 247 612 252 652 252 Z" className={s.fillCanvasSoft} />
        <path d="M112 250 C 158 224 226 218 286 240" className={s.farLine} />
        <path d="M352 244 C 402 222 458 218 504 232" className={s.farLine} />
        <path d="M40 252 C 86 230 148 226 202 244" className={s.farLine} />
        <path d="M440 248 C 490 228 546 226 596 240" className={s.farLine} />
      </g>

      {/* ── 3 · FOREST BAND ─────────────────────────────────────── */}
      <g data-layer="forest-band">
        <path
          d="M-10 252
             C 8 226 34 218 50 230 C 62 210 92 206 106 224
             C 122 204 152 206 162 226 C 178 208 206 210 216 230
             C 232 212 258 214 268 232 C 284 214 310 216 320 234
             C 336 216 362 216 372 234 C 388 214 414 214 426 232
             C 442 210 470 212 482 230 C 498 208 526 210 538 228
             C 552 208 582 206 594 226 C 608 214 632 218 650 236
             L 650 252 Z"
          className={s.fillForest}
        />
        <path d="M22 252 L22 234" className={s.forestLine} />
        <path d="M68 252 L68 230" className={s.forestLine} />
        <path d="M110 252 L110 228" className={s.forestLine} />
        <path d="M152 252 L152 232" className={s.forestLine} />
        <path d="M196 252 L196 234" className={s.forestLine} />
        <path d="M240 252 L240 236" className={s.forestLine} />
        <path d="M284 252 L284 238" className={s.forestLine} />
        <path d="M326 252 L326 238" className={s.forestLine} />
        <path d="M368 252 L368 238" className={s.forestLine} />
        <path d="M410 252 L410 236" className={s.forestLine} />
        <path d="M452 252 L452 234" className={s.forestLine} />
        <path d="M494 252 L494 232" className={s.forestLine} />
        <path d="M536 252 L536 232" className={s.forestLine} />
        <path d="M578 252 L578 230" className={s.forestLine} />
        <path d="M618 252 L618 234" className={s.forestLine} />
      </g>

      {/* ── 4 · MID TREES ───────────────────────────────────────── */}
      <g data-layer="mid-trees">
        <path d="M54 260 L58 214 L64 214 L69 260 Z" className={s.trunk} />
        <path d="M58 228 L44 214" className={s.foliageLine} />
        <path d="M64 232 L78 216" className={s.foliageLine} />
        <ellipse cx="42" cy="204" rx="21" ry="16" className={s.fillFoliage} />
        <ellipse cx="72" cy="196" rx="23" ry="18" className={s.fillFoliage} />
        <ellipse cx="56" cy="182" rx="20" ry="15" className={s.fillFoliage} />
        <ellipse cx="86" cy="210" rx="17" ry="13" className={s.fillFoliage} />
        <ellipse cx="34" cy="218" rx="15" ry="11" className={s.fillFoliage} />

        <path d="M574 258 L577 220 L582 220 L586 258 Z" className={s.trunk} />
        <path d="M577 232 L566 220" className={s.foliageLine} />
        <ellipse cx="564" cy="212" rx="19" ry="14" className={s.fillFoliage} />
        <ellipse cx="590" cy="204" rx="21" ry="15" className={s.fillFoliage} />
        <ellipse cx="576" cy="192" rx="17" ry="12" className={s.fillFoliage} />

        <path d="M620 256 L623 224 L627 224 L630 256 Z" className={s.trunk} />
        <ellipse cx="614" cy="216" rx="16" ry="12" className={s.fillFoliage} />
        <ellipse cx="632" cy="210" rx="17" ry="13" className={s.fillFoliage} />
      </g>

      {/* ── 5 · GROUND ──────────────────────────────────────────── */}
      <g data-layer="ground">
        <line x1="0" y1="252" x2="640" y2="252" className={s.horizon} />
        <path d="M0 266 C 90 260 180 264 260 260" className={s.hairline} />
        <path d="M380 260 C 470 264 560 260 640 266" className={s.hairline} />
        <path d="M0 280 C 100 274 190 278 280 274" className={s.hairline} />
      </g>

      {/* ── 6 · ROAD (fork in the road) ─────────────────────────── */}
      <g data-layer="road">
        <path d="M220 400 C 230 360 210 320 160 286 L 220 286 C 260 320 280 360 270 400 Z" className={s.fillCanvasSoft} />
        <path d="M220 400 C 230 360 210 320 160 286" className={s.roadLine} />
        <path d="M370 400 C 360 360 380 320 440 286 L 500 286 C 450 320 430 360 420 400 Z" className={s.fillCanvasSoft} />
        <path d="M420 400 C 430 360 450 320 500 286" className={s.roadLine} />
        <path d="M270 400 C 280 360 300 326 320 310 C 340 326 360 360 370 400" className={s.hairline} />
        <path d="M236 400 C 244 366 230 330 186 298" className={s.rut} />
        <path d="M394 400 C 386 366 400 330 464 298" className={s.rut} />
        <circle cx="200" cy="350" r="2" className={s.hairline} />
        <circle cx="430" cy="350" r="2" className={s.hairline} />
        <circle cx="320" cy="324" r="2.5" className={s.hairline} />
        <circle cx="214" cy="370" r="2" className={s.hairline} />
        <circle cx="414" cy="370" r="2" className={s.hairline} />
      </g>
      <g data-layer="structures">
        <ellipse cx="320" cy="306" rx="12" ry="3" className={s.fillShadow} />
        <path d="M316 304 L318 200 L324 200 L322 304 Z" className={s.woodLine} />
        <polygon points="316,200 320,192 324,200" className={s.woodLine} />

        <polygon points="318,206 250,206 242,215 250,224 318,224" className={s.fillWood} />
        <line x1="256" y1="215" x2="310" y2="215" className={s.hairline} />

        <polygon points="322,226 390,226 398,235 390,244 322,244" className={s.fillWood} />
        <line x1="330" y1="235" x2="384" y2="235" className={s.hairline} />

        {/* Fence on right side */}
        <path d="M520 334 L520 294" className={s.woodLine} />
        <path d="M556 328 L556 290" className={s.woodLine} />
        <path d="M590 322 L590 286" className={s.woodLine} />
        <path d="M622 316 L622 282" className={s.woodLine} />
        <path d="M518 304 C 550 300 588 296 624 292" className={s.woodLine} />
        <path d="M518 318 C 550 314 588 310 624 306" className={s.woodLine} />

        {/* Fence on left side */}
        <path d="M110 334 L110 294" className={s.woodLine} />
        <path d="M80 328 L80 290" className={s.woodLine} />
        <path d="M52 322 L52 286" className={s.woodLine} />
        <path d="M26 316 L26 282" className={s.woodLine} />
        <path d="M24 304 C 54 300 84 296 112 292" className={s.woodLine} />
        <path d="M24 318 C 54 314 84 310 112 306" className={s.woodLine} />

        {/* Milestone marker rock at the fork */}
        <ellipse cx="280" cy="374" rx="12" ry="4" className={s.fillShadow} />
        <path d="M272 372 C 270 354 288 354 288 372 Z" className={s.fillCanvas} />
        <line x1="280" y1="358" x2="280" y2="368" className={s.hairline} />
        {/* Receding cairn stones */}
        <circle cx="276" cy="364" r="5" className={s.fillCanvas} />
        <circle cx="282" cy="358" r="4" className={s.fillCanvas} />
        <circle cx="280" cy="353" r="3" className={s.fillCanvas} />
        {/* Trail markers along diverging tracks */}
        <path d="M180 348 L180 316" className={s.woodLine} />
        <path d="M152 338 L152 310" className={s.woodLine} />
        <path d="M450 348 L450 316" className={s.woodLine} />
        <path d="M476 338 L476 310" className={s.woodLine} />
        {/* Extra road stones & verge lines */}
        <circle cx="160" cy="392" r="3" className={s.hairline} />
        <circle cx="180" cy="386" r="2" className={s.hairline} />
        <circle cx="460" cy="392" r="3" className={s.hairline} />
        <circle cx="480" cy="386" r="2" className={s.hairline} />
        <circle cx="300" cy="390" r="2.5" className={s.hairline} />
        <circle cx="340" cy="390" r="2.5" className={s.hairline} />
        {/* Walking stick */}
        <path d="M336 322 L344 372" className={s.woodLine} />
        <ellipse cx="344" cy="373" rx="4" ry="1.5" className={s.fillShadow} />
        <path d="M312 308 C 304 316 304 332 312 336" className={s.figureLine} />
        <path d="M316 360 L318 344 M322 360 L324 348" className={s.hairline} />
        <path d="M326 360 L328 346" className={s.hairline} />
      </g>
      <g data-layer="figures">
        <ellipse cx="320" cy="372" rx="18" ry="3.5" className={s.fillShadow} />
        <circle cx="320" cy="288" r="9" className={s.figureLine} />
        <path d="M320 298 C 308 310 306 330 308 350 L 332 350 C 334 330 332 310 320 298 Z" className={s.figureLine} />
        <path d="M312 350 L310 370" className={s.figureLine} />
        <path d="M328 350 L330 370" className={s.figureLine} />
        <path d="M310 310 L298 322 L308 326" className={s.figureLine} />
        <path d="M330 310 L342 322 L332 326" className={s.figureLine} />

        {/* ACCENT: Unfolded map in carrot */}
        <path d="M304 318 L336 318 L340 338 L300 338 Z" className={s.accentCarrotFill} />
        <line x1="316" y1="318" x2="314" y2="338" className={s.hairline} />
        <line x1="326" y1="318" x2="328" y2="338" className={s.hairline} />
      </g>
      
      {/* ── 9 · FOREGROUND ──────────────────────────────────────── */}
      <g data-layer="foreground">
        
        <circle cx="210" cy="382" r="3" className={s.hairline} />
        <circle cx="430" cy="382" r="3" className={s.hairline} />
        <path d="M260 380 L266 384" className={s.hairline} />
        <path d="M374 380 L380 384" className={s.hairline} />
      
        <path d="M14 392 L18 374 M20 392 L22 378 M26 392 L24 376" className={s.nearLine} />
        <path d="M48 396 L52 376 M54 396 L57 382 M60 396 L58 378" className={s.nearLine} />
        <path d="M86 390 L90 372 M93 390 L95 378 M98 390 L96 374" className={s.nearLine} />
        <path d="M536 392 L540 372 M543 392 L546 378 M549 392 L548 374" className={s.nearLine} />
        <path d="M574 396 L578 376 M580 396 L583 382 M586 396 L584 378" className={s.nearLine} />
        <path d="M608 398 L612 376 M614 398 L617 382 M620 398 L618 374" className={s.nearLine} />
        <circle cx="112" cy="386" r="2.5" className={s.hairline} />
        <circle cx="126" cy="392" r="2" className={s.hairline} />
        <circle cx="496" cy="388" r="2.5" className={s.hairline} />
        <circle cx="510" cy="394" r="1.75" className={s.hairline} />
      </g>
    </>
  ),

  'offline-field': (s) => (
    <>

      
      {/* ── 1 · SKY ─────────────────────────────────────────────── */}
      <g data-layer="sky" className={s.drift}>
        <path d="M106 62 L114 56 L122 62" className={s.birdLine} />
        <path d="M138 48 L145 43 L152 48" className={s.birdLine} />
        <path d="M166 68 L172 63 L178 68" className={s.birdLine} />
        <path d="M486 54 L493 48 L500 54" className={s.birdLine} />
        <path d="M510 66 L516 61 L522 66" className={s.birdLine} />
        <path d="M536 50 L543 44 L550 50" className={s.birdLine} />
      </g>

      {/* ── 2 · FAR HILLS ───────────────────────────────────────── */}
      <g data-layer="far-hills">
        <path d="M-12 252 C 44 212 128 202 198 226 C 248 244 288 252 324 252 Z" className={s.fillCanvasSoft} />
        <path d="M284 252 C 348 214 436 204 510 228 C 566 247 612 252 652 252 Z" className={s.fillCanvasSoft} />
        <path d="M112 250 C 158 224 226 218 286 240" className={s.farLine} />
        <path d="M352 244 C 402 222 458 218 504 232" className={s.farLine} />
        <path d="M40 252 C 86 230 148 226 202 244" className={s.farLine} />
        <path d="M440 248 C 490 228 546 226 596 240" className={s.farLine} />
      </g>

      {/* ── 3 · FOREST BAND ─────────────────────────────────────── */}
      <g data-layer="forest-band">
        <path
          d="M-10 252
             C 8 226 34 218 50 230 C 62 210 92 206 106 224
             C 122 204 152 206 162 226 C 178 208 206 210 216 230
             C 232 212 258 214 268 232 C 284 214 310 216 320 234
             C 336 216 362 216 372 234 C 388 214 414 214 426 232
             C 442 210 470 212 482 230 C 498 208 526 210 538 228
             C 552 208 582 206 594 226 C 608 214 632 218 650 236
             L 650 252 Z"
          className={s.fillForest}
        />
        <path d="M22 252 L22 234" className={s.forestLine} />
        <path d="M68 252 L68 230" className={s.forestLine} />
        <path d="M110 252 L110 228" className={s.forestLine} />
        <path d="M152 252 L152 232" className={s.forestLine} />
        <path d="M196 252 L196 234" className={s.forestLine} />
        <path d="M240 252 L240 236" className={s.forestLine} />
        <path d="M284 252 L284 238" className={s.forestLine} />
        <path d="M326 252 L326 238" className={s.forestLine} />
        <path d="M368 252 L368 238" className={s.forestLine} />
        <path d="M410 252 L410 236" className={s.forestLine} />
        <path d="M452 252 L452 234" className={s.forestLine} />
        <path d="M494 252 L494 232" className={s.forestLine} />
        <path d="M536 252 L536 232" className={s.forestLine} />
        <path d="M578 252 L578 230" className={s.forestLine} />
        <path d="M618 252 L618 234" className={s.forestLine} />
      </g>

      {/* ── 4 · MID TREES ───────────────────────────────────────── */}
      <g data-layer="mid-trees">
        <path d="M54 260 L58 214 L64 214 L69 260 Z" className={s.trunk} />
        <path d="M58 228 L44 214" className={s.foliageLine} />
        <path d="M64 232 L78 216" className={s.foliageLine} />
        <ellipse cx="42" cy="204" rx="21" ry="16" className={s.fillFoliage} />
        <ellipse cx="72" cy="196" rx="23" ry="18" className={s.fillFoliage} />
        <ellipse cx="56" cy="182" rx="20" ry="15" className={s.fillFoliage} />
        <ellipse cx="86" cy="210" rx="17" ry="13" className={s.fillFoliage} />
        <ellipse cx="34" cy="218" rx="15" ry="11" className={s.fillFoliage} />

        <path d="M574 258 L577 220 L582 220 L586 258 Z" className={s.trunk} />
        <path d="M577 232 L566 220" className={s.foliageLine} />
        <ellipse cx="564" cy="212" rx="19" ry="14" className={s.fillFoliage} />
        <ellipse cx="590" cy="204" rx="21" ry="15" className={s.fillFoliage} />
        <ellipse cx="576" cy="192" rx="17" ry="12" className={s.fillFoliage} />

        <path d="M620 256 L623 224 L627 224 L630 256 Z" className={s.trunk} />
        <ellipse cx="614" cy="216" rx="16" ry="12" className={s.fillFoliage} />
        <ellipse cx="632" cy="210" rx="17" ry="13" className={s.fillFoliage} />
      </g>

      {/* ── 5 · GROUND ──────────────────────────────────────────── */}
      <g data-layer="ground">
        <line x1="0" y1="252" x2="640" y2="252" className={s.horizon} />
        <path d="M0 266 C 90 260 180 264 260 260" className={s.hairline} />
        <path d="M380 260 C 470 264 560 260 640 266" className={s.hairline} />
        <path d="M0 280 C 100 274 190 278 280 274" className={s.hairline} />
      </g>

      {/* ── 6 · ROAD ────────────────────────────────────────────── */}
      <g data-layer="road">
        <path d="M30 400 C 130 370 260 330 380 306 L 460 306 C 420 330 340 366 260 400 Z" className={s.fillCanvasSoft} />
        <path d="M30 400 C 130 370 260 330 380 306" className={s.roadLine} />
        <path d="M260 400 C 340 366 420 330 460 306" className={s.roadLine} />
        <path d="M110 400 C 190 366 300 330 396 308" className={s.rut} />
        <path d="M180 400 C 250 366 340 330 420 308" className={s.rut} />
        <circle cx="150" cy="376" r="2.5" className={s.hairline} />
        <circle cx="220" cy="356" r="2" className={s.hairline} />
        <circle cx="280" cy="342" r="2.5" className={s.hairline} />
        <circle cx="340" cy="330" r="1.75" className={s.hairline} />
      </g>
      <g data-layer="structures">
        {/* Telephone pole */}
        <ellipse cx="210" cy="342" rx="16" ry="3.5" className={s.fillShadow} />
        <path d="M204 340 L208 120 L216 120 L212 340 Z" className={s.woodLine} />

        <rect x="176" y="140" width="68" height="8" rx="2" className={s.fillWood} />
        <rect x="184" y="132" width="6" height="8" rx="1" className={s.fillCanvas} />
        <rect x="210" y="132" width="6" height="8" rx="1" className={s.fillCanvas} />
        <rect x="234" y="132" width="6" height="8" rx="1" className={s.fillCanvas} />

        <path d="M0 136 C 80 142 140 144 186 136" className={s.hairline} />
        <path d="M238 136 C 360 160 520 150 640 130" className={s.hairline} />
        <path d="M212 136 C 216 160 214 200 224 230 C 230 250 220 270 226 290" className={s.nearLine} />

        {/* Distant second telegraph pole */}
        <ellipse cx="380" cy="274" rx="8" ry="2" className={s.fillShadow} />
        <path d="M378 272 L380 186 L384 186 L382 272 Z" className={s.woodLine} />
        <rect x="368" y="194" width="28" height="4" rx="1" className={s.fillWood} />
        <rect x="370" y="190" width="3" height="4" className={s.fillCanvas} />
        <rect x="388" y="190" width="3" height="4" className={s.fillCanvas} />
        <path d="M382 192 C 430 200 480 200 520 196" className={s.hairline} />
        {/* Distant third telegraph pole */}
        <ellipse cx="440" cy="262" rx="6" ry="1.5" className={s.fillShadow} />
        <path d="M439 260 L440 206 L442 206 L441 260 Z" className={s.woodLine} />
        <rect x="435" y="212" width="12" height="3" rx="0.5" className={s.fillWood} />
        <path d="M441 214 C 470 218 500 218 530 214" className={s.hairline} />
        {/* Dilapidated fence extensions */}
        <path d="M226 304 L226 280" className={s.woodLine} />
        <path d="M246 298 L246 278" className={s.woodLine} />
        <path d="M264 294 L264 276" className={s.woodLine} />
        <circle cx="246" cy="274" r="2.5" className={s.figureLine} />
        {/* Boulders & grass tufts */}
        <ellipse cx="180" cy="374" rx="14" ry="5" className={s.fillShadow} />
        <circle cx="180" cy="370" r="7" className={s.fillCanvas} />
        <circle cx="190" cy="372" r="5" className={s.fillCanvas} />
        <ellipse cx="480" cy="370" rx="12" ry="4" className={s.fillShadow} />
        <circle cx="480" cy="366" r="6" className={s.fillCanvas} />
        <circle cx="490" cy="368" r="4" className={s.fillCanvas} />
        <path d="M210 392 L214 370 M216 392 L218 376 M222 392 L220 372" className={s.nearLine} />
        <path d="M420 392 L424 370 M426 392 L428 376 M432 392 L430 372" className={s.nearLine} />
        <circle cx="148" cy="384" r="3" className={s.fillCanvas} />
        <circle cx="460" cy="386" r="3" className={s.fillCanvas} />

        {/* Distant small market stall silhouette on horizon */}
        <path d="M480 252 L480 236 L510 236 L510 252 Z" className={s.fillCanvas} />
        <path d="M476 236 C 490 230 500 230 514 236 Z" className={s.fillWhite} />

        {/* Dilapidated field fence */}
        <path d="M28 340 L28 304" className={s.woodLine} />
        <path d="M68 334 L68 300" className={s.woodLine} />
        <path d="M106 328 L106 296" className={s.woodLine} />
        <path d="M142 322 L142 292" className={s.woodLine} />
        <path d="M174 316 L174 288" className={s.woodLine} />
        <path d="M202 310 L202 284" className={s.woodLine} />
        <path d="M26 312 C 90 306 150 298 204 290" className={s.hairline} />
        <path d="M26 324 C 90 316 150 308 204 300" className={s.hairline} />
      </g>
      <g data-layer="figures">
        {/* Desolate field — lone bird on distant fence post */}
        <circle cx="202" cy="280" r="3" className={s.figureLine} />
      </g>
      
      {/* ── 9 · FOREGROUND ──────────────────────────────────────── */}
      <g data-layer="foreground">
        
        {/* Tall wild pasture grass & rocks */}
        <path d="M12 390 L16 364 M18 390 L22 368 M24 390 L26 362 M28 390 L32 366" className={s.nearLine} />
        <path d="M130 396 L134 370 M137 396 L140 374 M144 396 L146 368" className={s.nearLine} />
        <path d="M310 394 L314 368 M317 394 L320 372 M324 394 L326 366" className={s.nearLine} />
        <circle cx="260" cy="384" r="4" className={s.fillCanvas} />
        <circle cx="270" cy="386" r="3" className={s.fillCanvas} />
        <ellipse cx="260" cy="389" rx="6" ry="1.5" className={s.fillShadow} />
        <ellipse cx="270" cy="390" rx="4" ry="1.5" className={s.fillShadow} />
        <path d="M280 392 L284 374 M286 392 L288 378 M292 392 L290 376" className={s.nearLine} />
        <path d="M350 392 L354 374 M356 392 L358 378 M362 392 L360 376" className={s.nearLine} />
      
        <path d="M14 392 L18 374 M20 392 L22 378 M26 392 L24 376" className={s.nearLine} />
        <path d="M48 396 L52 376 M54 396 L57 382 M60 396 L58 378" className={s.nearLine} />
        <path d="M86 390 L90 372 M93 390 L95 378 M98 390 L96 374" className={s.nearLine} />
        <path d="M536 392 L540 372 M543 392 L546 378 M549 392 L548 374" className={s.nearLine} />
        <path d="M574 396 L578 376 M580 396 L583 382 M586 396 L584 378" className={s.nearLine} />
        <path d="M608 398 L612 376 M614 398 L617 382 M620 398 L618 374" className={s.nearLine} />
        <circle cx="112" cy="386" r="2.5" className={s.hairline} />
        <circle cx="126" cy="392" r="2" className={s.hairline} />
        <circle cx="496" cy="388" r="2.5" className={s.hairline} />
        <circle cx="510" cy="394" r="1.75" className={s.hairline} />
      </g>
    </>
  ),

  'first-review': (s) => (
    <>

      
      {/* ── 1 · SKY ─────────────────────────────────────────────── */}
      <g data-layer="sky" className={s.drift}>
        <path d="M106 62 L114 56 L122 62" className={s.birdLine} />
        <path d="M138 48 L145 43 L152 48" className={s.birdLine} />
        <path d="M166 68 L172 63 L178 68" className={s.birdLine} />
        <path d="M486 54 L493 48 L500 54" className={s.birdLine} />
        <path d="M510 66 L516 61 L522 66" className={s.birdLine} />
        <path d="M536 50 L543 44 L550 50" className={s.birdLine} />
      </g>

      {/* ── 2 · FAR HILLS ───────────────────────────────────────── */}
      <g data-layer="far-hills">
        <path d="M-12 252 C 44 212 128 202 198 226 C 248 244 288 252 324 252 Z" className={s.fillCanvasSoft} />
        <path d="M284 252 C 348 214 436 204 510 228 C 566 247 612 252 652 252 Z" className={s.fillCanvasSoft} />
        <path d="M112 250 C 158 224 226 218 286 240" className={s.farLine} />
        <path d="M352 244 C 402 222 458 218 504 232" className={s.farLine} />
        <path d="M40 252 C 86 230 148 226 202 244" className={s.farLine} />
        <path d="M440 248 C 490 228 546 226 596 240" className={s.farLine} />
      </g>

      {/* ── 3 · FOREST BAND ─────────────────────────────────────── */}
      <g data-layer="forest-band">
        <path
          d="M-10 252
             C 8 226 34 218 50 230 C 62 210 92 206 106 224
             C 122 204 152 206 162 226 C 178 208 206 210 216 230
             C 232 212 258 214 268 232 C 284 214 310 216 320 234
             C 336 216 362 216 372 234 C 388 214 414 214 426 232
             C 442 210 470 212 482 230 C 498 208 526 210 538 228
             C 552 208 582 206 594 226 C 608 214 632 218 650 236
             L 650 252 Z"
          className={s.fillForest}
        />
        <path d="M22 252 L22 234" className={s.forestLine} />
        <path d="M68 252 L68 230" className={s.forestLine} />
        <path d="M110 252 L110 228" className={s.forestLine} />
        <path d="M152 252 L152 232" className={s.forestLine} />
        <path d="M196 252 L196 234" className={s.forestLine} />
        <path d="M240 252 L240 236" className={s.forestLine} />
        <path d="M284 252 L284 238" className={s.forestLine} />
        <path d="M326 252 L326 238" className={s.forestLine} />
        <path d="M368 252 L368 238" className={s.forestLine} />
        <path d="M410 252 L410 236" className={s.forestLine} />
        <path d="M452 252 L452 234" className={s.forestLine} />
        <path d="M494 252 L494 232" className={s.forestLine} />
        <path d="M536 252 L536 232" className={s.forestLine} />
        <path d="M578 252 L578 230" className={s.forestLine} />
        <path d="M618 252 L618 234" className={s.forestLine} />
      </g>

      {/* ── 4 · MID TREES ───────────────────────────────────────── */}
      <g data-layer="mid-trees">
        <path d="M54 260 L58 214 L64 214 L69 260 Z" className={s.trunk} />
        <path d="M58 228 L44 214" className={s.foliageLine} />
        <path d="M64 232 L78 216" className={s.foliageLine} />
        <ellipse cx="42" cy="204" rx="21" ry="16" className={s.fillFoliage} />
        <ellipse cx="72" cy="196" rx="23" ry="18" className={s.fillFoliage} />
        <ellipse cx="56" cy="182" rx="20" ry="15" className={s.fillFoliage} />
        <ellipse cx="86" cy="210" rx="17" ry="13" className={s.fillFoliage} />
        <ellipse cx="34" cy="218" rx="15" ry="11" className={s.fillFoliage} />

        <path d="M574 258 L577 220 L582 220 L586 258 Z" className={s.trunk} />
        <path d="M577 232 L566 220" className={s.foliageLine} />
        <ellipse cx="564" cy="212" rx="19" ry="14" className={s.fillFoliage} />
        <ellipse cx="590" cy="204" rx="21" ry="15" className={s.fillFoliage} />
        <ellipse cx="576" cy="192" rx="17" ry="12" className={s.fillFoliage} />

        <path d="M620 256 L623 224 L627 224 L630 256 Z" className={s.trunk} />
        <ellipse cx="614" cy="216" rx="16" ry="12" className={s.fillFoliage} />
        <ellipse cx="632" cy="210" rx="17" ry="13" className={s.fillFoliage} />
      </g>

      {/* ── 5 · GROUND ──────────────────────────────────────────── */}
      <g data-layer="ground">
        <line x1="0" y1="252" x2="640" y2="252" className={s.horizon} />
        <path d="M0 266 C 90 260 180 264 260 260" className={s.hairline} />
        <path d="M380 260 C 470 264 560 260 640 266" className={s.hairline} />
        <path d="M0 280 C 100 274 190 278 280 274" className={s.hairline} />
      </g>

      {/* ── 6 · ROAD ────────────────────────────────────────────── */}
      <g data-layer="road">
        <path d="M30 400 C 130 370 260 330 380 306 L 460 306 C 420 330 340 366 260 400 Z" className={s.fillCanvasSoft} />
        <path d="M30 400 C 130 370 260 330 380 306" className={s.roadLine} />
        <path d="M260 400 C 340 366 420 330 460 306" className={s.roadLine} />
        <path d="M110 400 C 190 366 300 330 396 308" className={s.rut} />
        <path d="M180 400 C 250 366 340 330 420 308" className={s.rut} />
        <circle cx="150" cy="376" r="2.5" className={s.hairline} />
        <circle cx="220" cy="356" r="2" className={s.hairline} />
        <circle cx="280" cy="342" r="2.5" className={s.hairline} />
        <circle cx="340" cy="330" r="1.75" className={s.hairline} />
      </g>
      <g data-layer="structures">
        <path d="M410 304 L410 200" className={s.woodLine} />
        <path d="M580 304 L580 200" className={s.woodLine} />
        <path d="M398 196 C 460 172 530 172 592 196 L 592 206 C 530 182 460 182 398 206 Z" className={s.fillWhite} />
        <path d="M398 206 C 412 214 426 214 440 206" className={s.woodLine} />
        <path d="M440 206 C 454 214 468 214 482 206" className={s.woodLine} />
        <path d="M482 206 C 496 214 510 214 524 206" className={s.woodLine} />
        <path d="M524 206 C 538 214 552 214 566 206" className={s.woodLine} />
        <path d="M566 206 C 578 214 586 214 592 206" className={s.woodLine} />
        <path d="M414 262 L576 262 L576 274 L414 274 Z" className={s.fillWood} />
        <path d="M428 244 L472 244 L472 262 L428 262 Z" className={s.fillCanvas} />
        <line x1="428" y1="253" x2="472" y2="253" className={s.woodLine} />
        <line x1="434" y1="244" x2="434" y2="262" className={s.hairline} />
        <line x1="466" y1="244" x2="466" y2="262" className={s.hairline} />
        <circle cx="442" cy="238" r="5.5" className={s.fillFoliage} />
        <circle cx="454" cy="238" r="5.5" className={s.fillFoliage} />
      </g>
      <g data-layer="figures">
        <ellipse cx="360" cy="308" rx="10" ry="2.5" className={s.fillShadow} />
        <circle cx="360" cy="270" r="6" className={s.figureLine} />
        <path d="M360 276 L355 296 L365 296 Z" className={s.figureLine} />
        <path d="M356 296 L355 306" className={s.figureLine} />
        <path d="M364 296 L365 306" className={s.figureLine} />
      </g>
      
      {/* ── 9 · FOREGROUND ──────────────────────────────────────── */}
      <g data-layer="foreground">
        
        <ellipse cx="240" cy="386" rx="95" ry="8" className={s.fillShadow} />
        <path d="M152 316 L316 316 L316 384 L152 384 Z" className={s.fillCanvas} />
        <line x1="152" y1="334" x2="316" y2="334" className={s.nearLine} />
        <line x1="152" y1="352" x2="316" y2="352" className={s.nearLine} />
        <line x1="152" y1="368" x2="316" y2="368" className={s.nearLine} />
        <path d="M152 316 L164 316 L164 384 L152 384 Z" className={s.fillWood} />
        <path d="M304 316 L316 316 L316 384 L304 384 Z" className={s.fillWood} />
        <line x1="158" y1="324" x2="158" y2="378" className={s.hairline} />
        <line x1="310" y1="324" x2="310" y2="378" className={s.hairline} />
        <circle cx="158" cy="328" r="1.5" className={s.hairline} />
        <circle cx="310" cy="328" r="1.5" className={s.hairline} />
        <circle cx="158" cy="372" r="1.5" className={s.hairline} />
        <circle cx="310" cy="372" r="1.5" className={s.hairline} />

        {/* Small chalkboard on crate with 5 stars */}
        <path d="M190 252 L300 248 L302 296 L192 300 Z" className={s.fillWood} />
        <path d="M196 256 L294 252 L296 292 L198 296 Z" className={s.fillCanvas} />

        {/* Star 1 (filled accent) */}
        <polygon points="210,268 213,274 219,275 214,279 216,285 210,282 204,285 206,279 201,275 207,274" className={s.accentCarrotFill} />
        {/* Star 2 (outline) */}
        <polygon points="228,268 231,274 237,275 232,279 234,285 228,282 222,285 224,279 219,275 225,274" className={s.hairline} />
        {/* Star 3 (outline) */}
        <polygon points="246,268 249,274 255,275 250,279 252,285 246,282 240,285 242,279 237,275 243,274" className={s.hairline} />
        {/* Star 4 (outline) */}
        <polygon points="264,268 267,274 273,275 268,279 270,285 264,282 258,285 260,279 255,275 261,274" className={s.hairline} />
        {/* Star 5 (outline) */}
        <polygon points="282,268 285,274 291,275 286,279 288,285 282,282 276,285 278,279 273,275 279,274" className={s.hairline} />

        {/* Note paper */}
        <polygon points="180,330 250,324 256,368 186,374" className={s.fillWhite} />
        <line x1="190" y1="338" x2="242" y2="334" className={s.hairline} />
        <line x1="192" y1="346" x2="244" y2="342" className={s.hairline} />
        <line x1="194" y1="354" x2="246" y2="350" className={s.hairline} />
        <line x1="196" y1="362" x2="236" y2="358" className={s.hairline} />

        {/* Carpenter pencil */}
        <path d="M260 340 L292 358 L288 364 L256 346 Z" className={s.fillWood} />
        <polygon points="256,346 250,344 260,340" className={s.fillCanvas} />
        <polygon points="252,344 250,344 254,342" className={s.nearLine} />
        {/* Chalkboard easel supports */}
        <path d="M246 296 L244 316" className={s.woodLine} />
        <path d="M252 296 L254 316" className={s.woodLine} />
        {/* Ruler on crate */}
        <polygon points="266,368 316,382 314,388 264,374" className={s.fillWood} />
        <line x1="272" y1="371" x2="274" y2="375" className={s.hairline} />
        <line x1="282" y1="374" x2="284" y2="378" className={s.hairline} />
        <line x1="292" y1="377" x2="294" y2="381" className={s.hairline} />
        <line x1="302" y1="380" x2="304" y2="384" className={s.hairline} />
        {/* Extra crate nails */}
        <circle cx="164" cy="320" r="1.5" className={s.hairline} />
        <circle cx="304" cy="320" r="1.5" className={s.hairline} />
        <circle cx="164" cy="380" r="1.5" className={s.hairline} />
        <circle cx="304" cy="380" r="1.5" className={s.hairline} />

        {/* Dropped berry with stem beside crate */}
        <circle cx="340" cy="378" r="4" className={s.fillCanvas} />
        <path d="M340 374 C 342 368 346 366 348 368" className={s.hairline} />
      
        <path d="M14 392 L18 374 M20 392 L22 378 M26 392 L24 376" className={s.nearLine} />
        <path d="M48 396 L52 376 M54 396 L57 382 M60 396 L58 378" className={s.nearLine} />
        <path d="M86 390 L90 372 M93 390 L95 378 M98 390 L96 374" className={s.nearLine} />
        <path d="M536 392 L540 372 M543 392 L546 378 M549 392 L548 374" className={s.nearLine} />
        <path d="M574 396 L578 376 M580 396 L583 382 M586 396 L584 378" className={s.nearLine} />
        <path d="M608 398 L612 376 M614 398 L617 382 M620 398 L618 374" className={s.nearLine} />
        <circle cx="112" cy="386" r="2.5" className={s.hairline} />
        <circle cx="126" cy="392" r="2" className={s.hairline} />
        <circle cx="496" cy="388" r="2.5" className={s.hairline} />
        <circle cx="510" cy="394" r="1.75" className={s.hairline} />
      </g>
    </>
  ),

};

export default SCENES;
