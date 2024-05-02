let currentImageElement: HTMLImageElement | null = null;
let hasBorder = false;
const IMAGE_LIST_COLS = 8;
const IMAGE_LIST_GAP = 4;
const SPINNER = `
<div id="spinner">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid" width="224" height="224" style="shape-rendering: auto; display: block; background: transparent;" xmlns:xlink="http://www.w3.org/1999/xlink"><g><g transform="rotate(0 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.99s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(3.6 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.98s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(7.2 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.97s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(10.8 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.96s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(14.4 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.95s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(18 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.94s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(21.6 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.93s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(25.2 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.92s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(28.8 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.91s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(32.4 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.9s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(36 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.89s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(39.6 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.88s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(43.2 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.87s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(46.8 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.86s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(50.4 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.85s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(54 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.84s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(57.6 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.83s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(61.2 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.82s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(64.8 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.81s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(68.4 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.8s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(72 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.79s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(75.6 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.78s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(79.2 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.77s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(82.8 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.76s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(86.4 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.75s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(90 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.74s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(93.6 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.73s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(97.2 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.72s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(100.8 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.71s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(104.4 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.7s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(108 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.69s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(111.6 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.68s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(115.2 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.67s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(118.8 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.66s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(122.4 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.65s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(126 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.64s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(129.6 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.63s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(133.2 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.62s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(136.8 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.61s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(140.4 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.6s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(144 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.59s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(147.6 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.58s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(151.2 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.57s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(154.8 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.56s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(158.4 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.55s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(162 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.54s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(165.6 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.53s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(169.2 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.52s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(172.8 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.51s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(176.4 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.5s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(180 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.49s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(183.6 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.48s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(187.2 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.47s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(190.8 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.46s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(194.4 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.45s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(198 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.44s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(201.6 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.43s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(205.2 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.42s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(208.8 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.41s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(212.4 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.4s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(216 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.39s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(219.6 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.38s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(223.2 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.37s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(226.8 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.36s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(230.4 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.35s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(234 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.34s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(237.6 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.33s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(241.2 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.32s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(244.8 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.31s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(248.4 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.3s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(252 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.29s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(255.6 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.28s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(259.2 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.27s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(262.8 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.26s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(266.4 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.25s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(270 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.24s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(273.6 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.23s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(277.2 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.22s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(280.8 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.21s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(284.4 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.2s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(288 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.19s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(291.6 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.18s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(295.2 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.17s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(298.8 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.16s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(302.4 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.15s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(306 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.14s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(309.6 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.13s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(313.2 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.12s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(316.8 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.11s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(320.4 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.1s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(324 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.09s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(327.6 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.08s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(331.2 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.07s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(334.8 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.06s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(338.4 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.05s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(342 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.04s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(345.6 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.03s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(349.2 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.02s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(352.8 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.01s" repeatCount="indefinite"></animate>
  </rect>
</g><g transform="rotate(356.4 50 50)">
  <rect x="47" y="19.5" rx="3" ry="0.5" width="6" height="1" fill="#ffffff">
    <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="0s" repeatCount="indefinite"></animate>
  </rect>
</g><g></g></g><!-- [ldio] generated by https://loading.io --></svg>
</div>`;
const imageDataMap: Map<HTMLImageElement, StyleData> = new Map();
const convertedSvgMap: Map<SVGElement, HTMLImageElement> = new Map();
const convertedImgToSVGMap: Map<HTMLImageElement, SVGElement> = new Map();
const convertSVGToImg = (img: SVGElement) => {
  const pseudoImage = (() => {
    const pseudo = convertedSvgMap.get(img);

    if (pseudo) {
      return pseudo;
    }

    const element = document.createElement('img');
    convertedSvgMap.set(img, element);
    convertedImgToSVGMap.set(element, img);
    return element;
  })();

  img.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

  const svgData = img.outerHTML;
  pseudoImage.src = 'data:image/svg+xml,' + encodeURIComponent(svgData);
  return pseudoImage;
};
const defaultState: StyleData = {
  isInDialog: false,
  clonedImage: null,
  scale: 100,
  oldScale: 100,
  rotate: 0,
  reverse: false,
  render: 'crisp-edges',
  fileSize: 'loading...',
  fileType: 'loading...',
};
const { imageViewer, dialog, showDialog, dialogContains, getImageData, setImageData } = (() => {
  const getImageData = (key: HTMLImageElement) => {
    if (!imageDataMap.has(key)) {
      imageDataMap.set(key, { ...defaultState });
    }

    return { ...imageDataMap.get(key) } as StyleData;
  };
  const dialog = (() => {
    const element = document.createElement('dialog');

    element.role = 'dialog';
    element.ariaModal = 'true';
    element.ariaLabel = 'Image Viewer';
    element.addEventListener('keydown', (e) => {
      if (e.key === 'ESC') {
        e.preventDefault();
        e.stopPropagation();
        dialog.close();
      }
    });

    return element;
  })();
  const setImageData = (
    img: HTMLImageElement,
    options: Options,
    noNeedInitScreen: boolean = false,
  ) => {
    if (!img) {
      return;
    }

    const baseImageData = getImageData(img);
    const oldScale = baseImageData.scale;
    const imageData = {
      ...baseImageData,
      ...options,
      oldScale,
    } as StyleData;

    imageDataMap.set(img, {
      ...imageData,
    });

    if (noNeedInitScreen) {
      return;
    }

    // TODO: ダイアログの外でいじったのを中に伝搬させる。内から外は対応しない。
    const { isInDialog } = imageData;
    const rotate = `rotateZ(${imageData.rotate}deg)`;
    const reverse = imageData.reverse ? 'rotateY(180deg)' : '';
    const scale = `scale(${imageData.scale / 100})`;

    img.style.transform = `${rotate} ${reverse} ${isInDialog ? '' : scale}`;

    if (hasBorder) {
      img.classList.add('has-border');
    } else {
      img.classList.remove('has-border');
    }

    if (isInDialog) {
      const getSize = (img: HTMLImageElement, scale: number) => {
        const width = img.naturalWidth * (scale / 100);
        const height = img.naturalHeight * (scale / 100);
        const contentWidth = ((canvas.clientWidth ?? 0) + width / 2) * 2 - 10;
        const contentHeight = ((canvas.clientHeight ?? 0) + height / 2) * 2 - 10;

        return {
          spaceSize: {
            width: contentWidth,
            height: contentHeight,
          },
        };
      };

      const { scale, oldScale, render } = imageData;
      const { spaceSize } = getSize(img, scale);
      const olsSpaceSize = getSize(img, oldScale).spaceSize;

      img.style.width = '';
      img.style.height = '';
      img.style.imageRendering = '';
      img.style.cssText = `
        ${img.getAttribute('style')}
        width: ${img.naturalWidth * (scale / 100)}px !important;
        height: ${img.naturalHeight * (scale / 100)}px !important;
        image-rendering: ${render} !important;
      `;

      spaceElement.style.cssText = `
        width: ${spaceSize.width}px !important;
        height: ${spaceSize.height}px !important;
      `;

      const diffWidth = (olsSpaceSize.width - spaceSize.width) / 2;
      const diffHeight = (olsSpaceSize.height - spaceSize.height) / 2;
      const { scrollTop, scrollLeft } = canvas;

      canvas.scroll({
        top: scrollTop - diffHeight,
        left: scrollLeft - diffWidth,
      });

      setInputValues(imageData);
    }
  };
  const { details, formControls } = (() => {
    const element = document.createElement('div');

    element.id = 'details';
    element.insertAdjacentHTML(
      'afterbegin',
      `
      <p class="close">
        <button type="button">${chrome.i18n.getMessage('button_close')}</button>
      </p>

      <div id="readonly">
        <p class="row">
          <label class="label" for="alt">${chrome.i18n.getMessage('readOnly_alt')}</label>
          <span class="control">
            <input
              id="alt"
              value=""
              readonly
            />
          </span>
        </p>
        <p class="row">
          <label class="label" for="url">${chrome.i18n.getMessage('readOnly_url')}</label>
          <span class="control">
            <input
              id="url"
              value=""
              readonly
            />
          </span>
        </p>
        <p class="row">
          <label class="label" for="type">${chrome.i18n.getMessage('readOnly_fileType')}</label>
          <span class="control">
            <input
              id="type"
              value=""
              class="right"
              readonly
            />
          </span>
        </p>
        <p class="row">
          <label class="label" for="size">${chrome.i18n.getMessage('readOnly_fileSize')}</label>
          <span class="control">
            <input
              id="size"
              value=""
              class="right"
              readonly
            />
          </span>
        </p>
        <p class="row">
          <label class="label" for="natural-width">${chrome.i18n.getMessage(
            'readOnly_naturalWidth',
          )}</label>
          <span class="control">
            <input
              id="natural-width"
              value=""
              class="right"
              readonly
            />
          </span>
        </p>
        <p class="row">
          <label class="label" for="natural-height">${chrome.i18n.getMessage(
            'readOnly_naturalHeight',
          )}</label>
          <span class="control">
            <input
              id="natural-height"
              value=""
              class="right"
              readonly
            />
          </span>
        </p>
        <p class="row">
          <label class="label" for="aspect">${chrome.i18n.getMessage('readOnly_aspect')}</label>
          <span class="control">
            <input
              id="aspect"
              value=""
              class="right"
              readonly
            />
          </span>
        </p>

        ${
          /*
        <p class="row">
          <label class="label" for="srcset-${ratio}">srcset ${ratio}</label>
          <span class="control">
            <input
              id="srcset-${ratio}"
              value=""
              readonly
            />
          </span>
        </p>
        */
          ''
        }
      </div>

      <div id="editable">
        <div class="checkbox-group">
          <p class="row">
            <label class="label" for="reverse">${chrome.i18n.getMessage('editable_reverse')}</label>
            <span class="control">
              <span class="checkbox">
                <input
                  id="reverse"
                  type="checkbox"
                />
              </span>
            </span>
          </p>

          <p class="row">
            <label class="label" for="border">${chrome.i18n.getMessage('editable_border')}</label>
            <span class="control">
              <span class="checkbox shared">
                <input
                  id="border"
                  type="checkbox"
                />
              </span>
            </span>
          </p>
        </div>

        <div class="row" role="group" aria-labelledby="scale-legend">
          <p class="label" id="scale-legend">
            <label for="scale">${chrome.i18n.getMessage('editable_scale')}</label>
          </p>
          <p class="control">
            <span class="field">
              <button type="button" id="scale-fit">FIT</button>
              <button type="button" id="scale-100">100%</button>
              <input
                type="number"
                name="scale"
                id="scale"
                value=""
                step="1"
                min="1"
                class="right"
              />
            </span>
            <span class="unit">%</span>
          </p>
        </div>

        <div class="row" role="group" aria-labelledby="rotate-legend">
          <p class="label" id="rotate-legend">
            <label for="rotate">${chrome.i18n.getMessage('editable_rotate')}</label>
          </p>
          <p class="control">
            <span class="field">
              <button type="button" id="rotate-reset">RESET</button>
              <input
                type="number"
                name="rotate"
                id="rotate"
                value=""
                step="1"
                min="-360"
                max="360"
                class="right"
              />
              <span class="unit">deg</span>
            </span>
          </p>
        </div>

        <p class="row">
          <label class="label" for="render">${chrome.i18n.getMessage('editable_render')}</label>
          <span class="control">
            <select
              id="render"
            >
            ${['crisp-edges', 'pixelated', 'smooth', 'high-quality'].map((value) => {
              return `<option>${value}</option>`;
            })}
            </select>
          </span>
        </p>

        <div class="group" id="color" role="group" aria-labelledby="background-label">
          <p id="background-label" class="legend">${chrome.i18n.getMessage(
            'editable_background',
          )}</p>
          <div class="control">
            <p class="button">
              <input type="color" aria-label="${chrome.i18n.getMessage(
                'editable_background_custom',
              )}" id="background-custom" value="#202124" />
            </p>
            <p class="button">
              <button type="button" id="background-bright">${chrome.i18n.getMessage(
                'editable_background_bright',
              )}</button>
            </p>
            <p class="button">
              <button type="button" id="background-dark">${chrome.i18n.getMessage(
                'editable_background_dark',
              )}</button>
            </p>
          </div>
        </div>
      </div>

      <div id="image-list-section" role="group" aria-labelledby="image-list-label">
        <div id="image-list-header">
          <p id="image-list-label" class="legend">${chrome.i18n.getMessage('image_list_title')}</p>

          <div id="image-list-buttons">
            <p><button type="button" id="image-list-reload">${chrome.i18n.getMessage(
              'image_list_reload',
            )}</button></p>
            <p><button type="button" id="image-list-prev">${chrome.i18n.getMessage(
              'image_list_prev',
            )}</button></p>
            <p><button type="button" id="image-list-next">${chrome.i18n.getMessage(
              'image_list_next',
            )}</button></p>
          </div>
        </div>

        <div id="image-list-wrapper" title="${chrome.i18n.getMessage('image_list_description')}">
          <ul id="image-list"></ul>
        </div>

        <p id="image-list-info">
          ${chrome.i18n.getMessage('image_list_info')}
          <span id="image-list-info-text" aria-live="polite"></span>
        </p>
      </div>

      <div class="group">
        <p>
          <button id="search">
            🔍 ${chrome.i18n.getMessage('search_in_page')}
          </button>
        </p>
      </div>
    `,
    );

    element.querySelector('button')?.addEventListener('click', () => {
      dialog.close();
    });

    const url = element.querySelector<HTMLInputElement>('#url')!;
    const alt = element.querySelector<HTMLInputElement>('#alt')!;
    const size = element.querySelector<HTMLInputElement>('#size')!;
    const type = element.querySelector<HTMLInputElement>('#type')!;
    const naturalWidth = element.querySelector<HTMLInputElement>('#natural-width')!;
    const naturalHeight = element.querySelector<HTMLInputElement>('#natural-height')!;
    const aspect = element.querySelector<HTMLInputElement>('#aspect')!;
    // const srcset = element.querySelector<HTMLInputElement>('#srcset')!;
    const scale = element.querySelector<HTMLInputElement>('#scale')!;
    const scaleFit = element.querySelector<HTMLInputElement>('#scale-fit')!;
    const scale100 = element.querySelector<HTMLInputElement>('#scale-100')!;
    const rotate = element.querySelector<HTMLInputElement>('#rotate')!;
    const rotateReset = element.querySelector<HTMLInputElement>('#rotate-reset')!;
    const reverse = element.querySelector<HTMLInputElement>('#reverse')!;
    const border = element.querySelector<HTMLInputElement>('#border')!;
    const render = element.querySelector<HTMLSelectElement>('#render')!;
    const imageListButtons = {
      reload: element.querySelector<HTMLButtonElement>('#image-list-reload')!,
      prev: element.querySelector<HTMLButtonElement>('#image-list-prev')!,
      next: element.querySelector<HTMLButtonElement>('#image-list-next')!,
    };
    const imageList = element.querySelector<HTMLElement>('#image-list')!;
    const imageListInfo = element.querySelector<HTMLElement>('#image-list-info-text')!;
    const searchButton = element.querySelector<HTMLButtonElement>('#search')!;

    const updateState = (options: Options) => {
      if (currentImageElement) {
        setImageData(currentImageElement, {
          ...options,
        });
      }
    };

    scale.addEventListener('input', () => {
      updateState({
        scale: Number(scale.value) ?? defaultState.scale,
      });
    });

    scaleFit.addEventListener('click', () => {
      if (currentImageElement) {
        updateState({
          scale: 100,
        });
        zoomAndScrollInit(currentImageElement, 'fit');
      }
    });

    scale100.addEventListener('click', () => {
      updateState({
        scale: 100,
      });
    });

    rotate.addEventListener('input', () => {
      updateState({
        rotate: Number(rotate.value) ?? defaultState.rotate,
      });
    });

    rotateReset.addEventListener('click', () => {
      updateState({
        rotate: 0,
      });
    });

    reverse.addEventListener('input', () => {
      updateState({
        reverse: reverse.checked,
      });
    });

    border.addEventListener('input', () => {
      hasBorder = border.checked;
      updateState({});
    });

    imageListButtons.reload.addEventListener('click', () => {
      createImageList();
    });
    imageListButtons.next.addEventListener('click', () => {
      const current = imageList.querySelector<HTMLButtonElement>('[aria-current="true"]');
      const target = current?.closest('li')?.nextElementSibling?.firstElementChild;

      if (target instanceof HTMLButtonElement) {
        target?.click();

        return;
      }

      const roopTarget =
        current?.closest('ul')?.firstElementChild?.firstElementChild ??
        imageList.querySelector('button');

      if (roopTarget instanceof HTMLButtonElement) {
        roopTarget?.click();
      }
    });
    imageListButtons.prev.addEventListener('click', () => {
      const current = imageList.querySelector<HTMLButtonElement>('[aria-current="true"]');
      const target = current?.closest('li')?.previousElementSibling?.firstElementChild;

      if (target instanceof HTMLButtonElement) {
        target?.click();

        return;
      }

      const roopTarget =
        current?.closest('ul')?.lastElementChild?.firstElementChild ??
        imageList.querySelector('button');

      if (roopTarget instanceof HTMLButtonElement) {
        roopTarget?.click();
      }
    });

    searchButton.addEventListener('click', () => {
      if (!currentImageElement) {
        return;
      }

      const data = getImageData(currentImageElement);

      if (data.isInDialog) {
        if (data.origin) {
          const origin = (() => {
            if (document.body.contains(data.origin)) {
              return data.origin;
            }

            if (data.origin instanceof HTMLImageElement) {
              return convertedImgToSVGMap.get(data.origin);
            }
          })();

          if (!origin) {
            alert(chrome.i18n.getMessage('searched_image_error'));

            return;
          }

          const point = document.createElement('span');
          const style = document.createElement('style');
          const uniqueString = `heppokofrontent-chrome-extension-image-controler-blink-${Date.now().toString(
            36,
          )}`;

          style.textContent = `
            @keyframes ${uniqueString} {
              0% {
                opacity: 1;
              }
              50% {
                opacity: 0.2;
              }
              100% {
                opacity: 1;
              }
            }

            .${uniqueString} {
              animation: ${uniqueString} 333ms ease-in-out 3;
            }
          `;

          point.tabIndex = 0;
          point.textContent = chrome.i18n.getMessage('searched_image_message');
          point.style.cssText =
            'all: unset; position: absolute; z-index: -1; width: 0; height: 0; overflow: hidden; display: block;';
          point.addEventListener('blur', () => {
            point.remove();
            style.remove();
            origin.classList.remove(uniqueString);
          });

          document.head.append(style);
          origin.before(point);
          dialog.close();

          const rect = origin.getBoundingClientRect();
          const isVisible =
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth);

          if (isVisible) {
            point.focus({
              preventScroll: true,
            });
            origin.classList.add(uniqueString);
          } else {
            origin.scrollIntoView();
            window.addEventListener('scrollend', () => {
              point.focus({
                preventScroll: true,
              });
              origin.classList.add(uniqueString);
            });
          }
        }
      }
    });

    const stopPropagation = (e: Event) => e.stopPropagation();
    scale.addEventListener('wheel', stopPropagation);
    rotate.addEventListener('wheel', stopPropagation);
    imageList.addEventListener('wheel', stopPropagation);
    imageList.addEventListener('keydown', (e) => {
      e.stopPropagation();

      if (e.key.startsWith('Arrow')) {
        e.preventDefault();
      }
    });

    // bgcolor
    const custom = element.querySelector<HTMLInputElement>('#background-custom');
    const bright = element.querySelector<HTMLButtonElement>('#background-bright');
    const dark = element.querySelector<HTMLButtonElement>('#background-dark');
    const inputEvent = new Event('input');

    if (custom) {
      bright?.addEventListener('click', () => {
        custom.value = '#fafafa';
        custom.dispatchEvent(inputEvent);
      });
      dark?.addEventListener('click', () => {
        custom.value = '#202124';
        custom.dispatchEvent(inputEvent);
      });

      custom.addEventListener('input', () => {
        dialog.style.cssText = `--canvas-background: ${custom.value}`;
        chrome.storage.local.set({
          background: custom.value,
        });
      });

      chrome.storage.local.get('background', ({ background }) => {
        if (background) {
          custom.value = background;
          custom.dispatchEvent(inputEvent);
        }
      });
    }

    const resolveRenderMode = (value: string): RenderingMode => {
      const types: RenderingMode[] = ['crisp-edges', 'pixelated', 'smooth', 'high-quality'];
      const isInvalid = (value: string): value is RenderingMode =>
        types.some((type) => type === value);

      if (isInvalid(value)) {
        return value;
      }

      return defaultState.render;
    };

    render.addEventListener('change', () => {
      updateState({
        render: resolveRenderMode(render.value),
      });
    });

    return {
      details: element,
      formControls: {
        url,
        alt,
        size,
        type,
        naturalWidth,
        naturalHeight,
        aspect,
        // srcset,
        scale,
        rotate,
        reverse,
        border,
        render,
        imageList,
        imageListInfo,
      },
    };
  })();
  const dialogContains = (image: HTMLImageElement) => {
    return image ? spaceElement.contains(image) : false;
  };
  const setInputValues = (imageData: StyleData) => {
    if (!imageData.isInDialog || !currentImageElement) {
      return;
    }

    formControls.url.value = currentImageElement.src;
    // alt 以外のアクセシブルネームをサポートするかどうか
    formControls.alt.value = currentImageElement.alt;
    formControls.size.value = imageData.fileSize;
    formControls.type.value = imageData.fileType;
    formControls.naturalWidth.value = `${currentImageElement.naturalWidth} px`;
    formControls.naturalHeight.value = `${currentImageElement.naturalHeight} px`;

    const getAspectRatio = (width: number, height: number) => {
      const getGCD = (a: number, b: number): number => {
        if (b === 0) {
          return a;
        }

        return getGCD(b, a % b);
      };

      const gcd = getGCD(width, height);
      const ratio = `${width / gcd} : ${height / gcd}`;

      return ratio;
    };

    formControls.aspect.value = getAspectRatio(
      currentImageElement.naturalWidth,
      currentImageElement.naturalHeight,
    );

    // formControls.srcset.value = hhhhhhh
    formControls.scale.value = String(imageData.scale);
    formControls.rotate.value = String(imageData.rotate);
    formControls.reverse.checked = imageData.reverse;
    formControls.border.checked = hasBorder;
    formControls.render.value = imageData.render;
  };

  const { canvas, spaceElement } = (() => {
    const outer = document.createElement('div');
    const inner = document.createElement('div');
    const moveState = {
      clientY: 0,
      clientX: 0,
      startY: 0,
      startX: 0,
    };
    const moveHandler = (e: MouseEvent) => {
      outer.scroll({
        top: moveState.startY + moveState.clientY - e.clientY,
        left: moveState.startX + moveState.clientX - e.clientX,
      });
    };

    outer.addEventListener('mousedown', (e) => {
      if (e.button !== 0) {
        return;
      }

      e.preventDefault();

      moveState.clientY = e.clientY;
      moveState.clientX = e.clientX;
      moveState.startX = outer.scrollLeft ?? 0;
      moveState.startY = outer.scrollTop ?? 0;
      window.addEventListener('mousemove', moveHandler);
    });

    outer.addEventListener('wheel', (e) => {
      e.preventDefault();

      if (!currentImageElement) {
        return;
      }

      const imageData = getImageData(currentImageElement);
      const mode = e.shiftKey ? 'rotate' : 'zoom';

      if (mode === 'rotate') {
        switch (e.deltaY < 0 ? 'right' : 'left') {
          case 'right':
            imageData.rotate += 10;

            if (360 <= imageData.rotate) {
              imageData.rotate -= 360;
            }

            break;

          case 'left':
            imageData.rotate -= 10;

            if (imageData.rotate < 0) {
              imageData.rotate += 360;
            }
            break;
        }
      } else {
        const diff = imageData.scale < 50 ? (imageData.scale < 40 ? 3 : 5) : 10;

        switch (e.deltaY < 0 ? 'in' : 'out') {
          case 'in':
            if (imageData.scale === 1) {
              imageData.scale = diff;
            } else {
              imageData.scale += diff;
            }
            break;

          case 'out':
            imageData.scale -= diff;

            if (imageData.scale <= 0) {
              imageData.scale = 1;
            }
            break;
        }
      }

      setImageData(currentImageElement, {
        ...imageData,
      });
    });

    window.addEventListener('mouseup', () => {
      window.removeEventListener('mousemove', moveHandler);
    });

    window.addEventListener('mouseleave', () => {
      window.removeEventListener('mousemove', moveHandler);
    });

    outer.id = 'canvas';
    inner.id = 'canvas-inner';
    outer.append(inner);

    return {
      canvas: outer,
      spaceElement: inner,
    };
  })();
  const style = (() => {
    const element = document.createElement('style');
    const convertToCSSText = (
      css: Record<string, Record<string, string | number>>,
      mediaQuery: string = '',
    ) => {
      let cssText = mediaQuery === '' ? '' : `${mediaQuery} {`;

      for (const [selector, styleObject] of Object.entries(css)) {
        let values = '';

        for (const [propertyName, value] of Object.entries(styleObject)) {
          values += `${propertyName}: ${value}; `;
        }

        cssText += ` ${selector} {${values}}`;
      }

      return `${cssText.trim()}${mediaQuery === '' ? '' : '}'}`;
    };

    element.dataset.from = 'chrome-extension-image-viewer';
    element.textContent = convertToCSSText({
      ':host': {
        display: 'block !important',
        position: 'fixed !important',
        left: '0 !important',
        top: '0 !important',
        '--outline': '2px solid #42ccc0',
        '--outline-offset': '2px',
      },
      '*': {
        'box-sizing': 'border-box',
        padding: 0,
        margin: 0,
      },
      ':focus': {
        outline: 'none',
      },
      ':focus-visible': {
        outline: 'var(--outline)',
        'outline-offset': 'var(--outline-offset)',
      },
      img: {
        position: 'absolute',
        inset: '0',
        margin: 'auto',
      },
      button: {
        color: '#111',
      },
      '.close': {
        'text-align': 'right',
        margin: '0 0 20px',
      },
      '.close button': {
        padding: '10px',
        background: '#42ccc0',
        border: 0,
        'border-radius': '6px',
        'min-width': '100px',
        'font-size': 'inherit',
      },
      dialog: {
        'font-size': '14px',
        position: 'fixed',
        inset: '0px',
        margin: 'auto',
        padding: '0',
        width: '90%',
        height: '90%',
        'max-width': 'calc(100% - 20px)',
        'max-height': 'calc(100% - 20px)',
        color: '#fff',
        background: '#282828',
        visibility: 'visible',
        overflow: 'hidden',
        opacity: '1',
        'box-sizing': 'border-box',
        border: 0,
        'border-radius': '4px',
        'box-shadow': '0 0 10px 0 rgb(0 0 0 / 80%)',
        '--canvas-background': '#202124',
      },
      'dialog::backdrop': {
        background: 'rgb(0 0 0 / 40%)',
      },
      'dialog:not([open])': {
        display: 'none !important',
      },
      '#canvas, #details': {
        height: '100%',
      },
      '#canvas': {
        display: 'grid',
        'place-items': 'center',
        'max-height': '70%',
        overflow: 'hidden',
        cursor: 'move',
        background: 'var(--canvas-background)',
      },
      '#canvas-inner': {
        display: 'block',
        position: 'relative',
        transition: 'opacity 100ms ease-in, visibility 100ms ease-in',
      },
      '#canvas-inner.loading': {
        opacity: 0,
        visibility: 'hidden',
        transition: 'none',
      },
      '#canvas img': {
        border: '1px solid transparent',
        'box-sizing': 'content-box',
      },
      '#canvas img.has-border': {
        outline: '1px solid #fff',
        'border-color': '#000',
      },
      '#spinner': {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '70%',
        'pointer-events': 'none',
      },
      '#spinner > svg': {
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
      },
      '#canvas:has(#canvas-inner:not(.loading)) + #spinner': {
        opacity: 0,
      },
      '#details': {
        padding: '20px 14px',
        background: '#292a2d',
        border: '2px solid #424242',
        'box-sizing': 'border-box',
        'max-height': '30%',
        overflow: 'auto',
        'scroll-behavior': 'smooth',
      },
      '#details input, #details select': {
        padding: '8px 6px 8px 4px',
        color: 'inherit',
        'font-size': 'inherit',
        'line-height': 'inherit',
        border: '0',
        background: 'transparent',
        'border-radius': '4px',
      },
      '#details input[readonly], #details select[readonly]': {
        outline: 'none',
        'border-radius': '0',
        'padding-bottom': '4px',
        'border-bottom': '1px solid transparent',
        'margin-bottom': '3px',
      },
      '#details input[readonly]:focus-visible, #details select[readonly]:focus-visible': {
        'border-bottom-color': '#cbd7db',
      },
      '#readonly .row, #editable .row, #editable .group': {
        display: 'grid',
        'grid-template-columns': '140px 1fr',
      },
      '#details .row .label, #details .group .legend': {
        display: 'grid',
        'align-items': 'center',
        padding: '0 8px',
      },
      '#details .row .control': {
        display: 'grid',
        'align-items': 'center',
        'grid-template-columns': '1fr auto',
        'padding-right': '8px',
      },
      '#details .row .field': {
        display: 'flex',
        background: '#1d1d1e',
        'border-radius': '4px',
      },
      '#details .row .field button': {
        'font-size': '11px',
        'font-family': 'monospace',
        'min-width': '40px',
        padding: '2px 0 0',
        margin: '4px 0 4px 4px',
        'border-radius': '4px',
        background: '#f0f0f0',
        border: '2px solid #1d1d1e',
      },
      '#details .row .field button:last-of-type': {
        'margin-right': '4px',
      },
      '#details .row .field button:hover': {
        opacity: '0.8',
      },
      '#details .row .field input': {
        padding: '8px 6px 8px 4px',
        width: '100%',
      },
      '#details .checkbox-group': {
        padding: '0 0 20px',
        'border-bottom': '1px solid #6a6a6a',
        display: 'grid',
        'grid-template-columns': '1fr 1fr',
      },
      '#details .checkbox-group .row:not(:host)': {
        'grid-template-columns': '80px 1fr',
      },
      '#details .checkbox-group .row:first-child': {
        'border-right': '1px solid #6a6a6a',
        'padding-right': '20px',
      },
      '#details .checkbox-group .row:last-child': {
        margin: 0,
        'padding-left': '10px',
      },
      '#details .group .control': {
        display: 'grid',
        gap: '20px',
      },
      '#details input': {
        'grid-column': '1 / 2',
      },
      '#details input:last-child, #details select:last-child': {
        'grid-column': '1 / 3',
      },
      '#details .unit': {
        padding: '8px 4px',
        'grid-column': '2 / 3',
        'min-width': '2.5em',
      },
      '#details input[type="checkbox"]': {
        inset: '0',
        position: 'absolute',
        opacity: '0',
        'z-index': 1,
      },
      '#details select': {
        width: '100%',
      },
      '#details option': {
        color: '#fff',
        background: '#515254',
      },
      '::-webkit-outer-spin-button, ::-webkit-inner-spin-button': {
        '-webkit-appearance': 'none',
        margin: 0,
      },
      '#readonly': {
        background: '#515254',
        'border-radius': '4px',
        margin: '0 0 20px',
      },
      '#readonly p:not(:first-child)': {
        'border-top': '1px solid #3f4042',
      },
      '#readonly .unit': {
        'padding-left': 0,
      },
      '#editable input:not([type="checkbox"]), #editable select': {
        background: '#1d1d1e',
      },
      '#editable .row:not(:first-child)': {
        margin: '12px 0 0',
      },
      '.checkbox': {
        position: 'relative',
        display: 'block',
        width: '80px',
        'min-height': '37px',
        'margin-left': 'auto',
      },
      '.checkbox::before, .checkbox::after': {
        position: 'absolute',
        top: '0',
        right: '0',
        bottom: '0',
        display: 'block',
        margin: 'auto 0',
        content: '""',
      },
      '.checkbox::before': {
        'z-index': '1',
        width: '32px',
        height: '32px',
        background: '#f0f3f4',
        'border-radius': '50%',
        'box-shadow': '0 0 3px rgb(0 0 0 / 60%)',
        transition: '0.2s right ease-out',
      },
      '.checkbox::after': {
        width: '72px',
        height: '32px',
        background: '#42ccc0',
        'border-radius': '20px',
        'box-shadow': '0 0 3px rgb(0 0 0 / 60%) inset',
        transition: '0.2s background-color ease-out',
      },
      '.checkbox.shared::after': {
        background: '#fdec00',
      },
      '.checkbox:has(input:not(:checked))::before': {
        right: '39px',
      },
      '.checkbox:has(input:not(:checked))::after': {
        'background-color': '#cbd7db',
      },
      '.checkbox:has(input:focus-visible)::after': {
        // 'box-shadow': '0 0 3px rgb(0 0 0 / 60%) inset, 0 0 0 2px #fff',
        outline: 'var(--outline)',
        'outline-offset': 'var(--outline-offset)',
      },
      '.right': {
        'text-align': 'right',
      },
      '#details .group': {
        padding: '20px 0 0',
        'border-top': '1px solid #6a6a6a',
        margin: '20px 0 0',
      },
      '#details #color .control': {
        'grid-template-columns': 'auto auto 1fr',
      },
      '#details #color #background-bright, #details #color #background-dark, #details #color #background-custom':
        {
          width: '44px',
          height: '44px',
          display: 'block',
          color: 'transparent',
          'user-select': 'none',
          overflow: 'hidden',
          padding: 0,
          'border-radius': '4px',
        },
      '#details #color #background-bright, #details #color #background-dark': {
        border: '2px solid #000',
      },
      '#details #color #background-bright': {
        background: '#fff',
      },
      '#details #color #background-dark': {
        background: '#202124',
      },
      '#details #color #background-custom': {
        border: '4px double #6a6a6a',
      },
      '#details #color #background-custom::-webkit-color-swatch-wrapper': {
        padding: 0,
      },
      '#details #color #background-custom::-webkit-color-swatch': {
        border: 0,
      },
      '#image-list-section': {
        display: 'grid',
        'grid-template-rows': 'auto minmax(180px,1fr)',
        padding: '0 8px',
      },
      '#image-list-header': {
        display: 'grid',
        'grid-template-columns': '132px 1fr',
        padding: '40px 0 9px',
        'align-items': 'center',
      },
      '#image-list-buttons': {
        display: 'grid',
        'grid-template-columns': '3fr 2fr 2fr',
        gap: '4px',
      },
      '#image-list-buttons button': {
        width: '100%',
        'font-size': '11px',
        'font-family': 'monospace',
        'min-width': '40px',
        padding: '5px 0 4px',
        'border-radius': '4px',
        background: '#f0f0f0',
        border: '2px solid #1d1d1e',
      },
      '#image-list-wrapper': {
        border: '1px solid #3f4042',
        'border-radius': '4px',
        background: '#515254',
        position: 'relative',
      },
      '#image-list': {
        position: 'absolute',
        top: '0',
        left: '0',
        padding: '8px',
        width: '100%',
        'max-height': '100%',
        display: 'flex',
        'flex-wrap': 'wrap',
        overflow: 'auto',
        'align-items': 'flex-start',
        transition: 'opacity 200ms ease-in, visibility 200ms ease-in',
        'scroll-behavior': 'smooth',
      },
      '#image-list.invisible': {
        opacity: 0,
        visibility: 'hidden',
        transition: 'none',
      },
      '.image-list-item': {
        all: 'unset',
        'max-width': `${100 / IMAGE_LIST_COLS}%`,
        'min-width': `${100 / IMAGE_LIST_COLS}%`,
        padding: `${IMAGE_LIST_GAP / 2}px`,
        'box-sizing': 'border-box',
        'aspect-ratio': '1/1',
      },
      '.image-list-item-button': {
        all: 'unset',
        display: 'block',
        width: '100%',
        height: '100%',
        border: '2px solid transparent',
        'aspect-ratio': '1/1',
        'border-radius': '4px',
        'box-sizing': 'border-box',
        outline: 'inherit',
        background: '#666769',
      },
      '.image-list-item-button:focus-visible': {
        outline: 'var(--outline)',
        'outline-offset': 'var(--outline-offset)',
      },
      '.image-list-item img, .image-list-item svg': {
        position: 'static',
        width: '100%',
        height: 'auto',
        'aspect-ratio': '1/1',
        'object-fit': 'cover',
      },
      '.image-list-item-button[aria-current="true"]': {
        background: 'var(--canvas-background)',
        'border-color': '#42ccc0',
      },
      '.image-list-item-button[aria-current="true"] img, .image-list-item-button[aria-current="true"] svg':
        {
          opacity: '0.2',
        },
      '#image-list-info': {
        'text-align': 'right',
        padding: '6px 0',
      },
      '#search': {
        width: '100%',
        'font-size': '12px',
        'font-family': 'monospace',
        padding: '7px 0 6px',
        margin: '4px 0 4px 4px',
        'border-radius': '4px',
        background: '#f0f0f0',
        border: '2px solid #1d1d1e',
      },
    });
    element.textContent += convertToCSSText(
      {
        dialog: {
          display: 'grid !important',
          'grid-template-columns': '1fr 450px',
        },
        '#canvas': {
          'max-height': 'none !important',
        },
        '#spinner': {
          width: 'calc(100% - 450px)',
          height: '100%',
        },
        '#details': {
          'max-height': 'none',
          display: 'grid',
          'grid-template-rows': 'auto auto auto 1fr',
        },
      },
      '@media (orientation: landscape)',
    );

    return element;
  })();
  const imageViewer = document.createElement('image-viewer');
  const shadowRoot = imageViewer.attachShadow({ mode: 'closed' });
  const zoomAndScrollInit = (
    targetImage: HTMLImageElement,
    scaleValue?: number | 'init' | 'fit',
  ) => {
    const scale = (() => {
      const baseScale = scaleValue ?? getImageData(targetImage).scale;

      if (typeof baseScale === 'string') {
        const fitHeight = (canvas.offsetHeight - 100) / targetImage.naturalHeight;
        const fitWidth = (canvas.offsetWidth - 100) / targetImage.naturalWidth;
        const result = Math.floor(Math.min(fitHeight, fitWidth) * 100);

        const isResizedRatioOverHalfAreaWhenInit =
          baseScale === 'init' &&
          100 <= result &&
          ((fitHeight <= fitWidth &&
            canvas.offsetHeight / 2 < targetImage.naturalHeight * result) ||
            (fitWidth <= fitHeight && canvas.offsetWidth / 2 < targetImage.naturalWidth * result));

        if (isResizedRatioOverHalfAreaWhenInit) {
          const fitHeight = (canvas.offsetHeight * 0.5) / targetImage.naturalHeight;
          const fitWidth = (canvas.offsetWidth * 0.5) / targetImage.naturalWidth;
          return Math.floor(Math.min(fitHeight, fitWidth) * 100);
        }

        return result;
      }

      return baseScale;
    })();

    setImageData(targetImage, {
      scale,
    });

    const { scrollWidth, offsetWidth, scrollHeight, offsetHeight } = canvas;

    canvas.scroll({
      top: (scrollHeight - offsetHeight) / 2,
      left: (scrollWidth - offsetWidth) / 2,
    });
  };
  const resizeSupport = () => {
    let setTimeoutId = -1;
    const wheelEvent = new Event('wheel');

    window.addEventListener('resize', () => {
      clearTimeout(setTimeoutId);

      setTimeoutId = setTimeout(() => {
        if (dialog.open && currentImageElement) {
          canvas.dispatchEvent(wheelEvent);
          zoomAndScrollInit(currentImageElement);
        }
      }, 300);
    });
  };
  const createImageList = (() => {
    // 404の画像があったり、bodyスクロール時に画像が追加されたりすると、画像を切り替えるたびにリストを再生成してチカチカしたりするのでキャッシュしておく
    let imagesCache: {
      src: string;
      alt: string;
      isError: boolean;
      originalElement: SVGElement | HTMLImageElement;
    }[] = [];

    return (noRecreate: boolean = false) => {
      const fragment = document.createDocumentFragment();
      const images = noRecreate
        ? imagesCache
        : [...document.querySelectorAll<HTMLImageElement | SVGElement>('img, svg')]
            .map((originalElement) => {
              if (originalElement instanceof HTMLImageElement) {
                const result = {
                  src: originalElement.src,
                  alt: originalElement.alt.trim(),
                  isError: false,
                  originalElement,
                };

                // support lazyload by script
                originalElement.addEventListener('load', async () => {
                  const clonedImage = document.createElement('img');
                  result.src = originalElement.src;
                  result.alt = originalElement.alt;
                  clonedImage.src = originalElement.src;
                  clonedImage.alt = originalElement.alt;

                  setImageData(
                    originalElement,
                    {
                      clonedImage,
                    },
                    true,
                  );
                  await getFileSize(clonedImage);
                  setImageData(
                    clonedImage,
                    {
                      isInDialog: true,
                      origin: originalElement,
                    },
                    true,
                  );
                });
                originalElement.addEventListener('error', () => {
                  result.isError = true;
                });

                return result;
              }

              const pseudoImage = convertedSvgMap.get(originalElement);

              if (pseudoImage) {
                return {
                  src: pseudoImage.src,
                  alt: pseudoImage.alt,
                  isError: false,
                  originalElement,
                };
              }

              const svg = convertSVGToImg(originalElement);
              const src = svg.src;
              const alt =
                svg.getAttribute('aria-label') ??
                svg.querySelector('title')?.textContent?.trim() ??
                '';

              return {
                src,
                alt,
                isError: false,
                originalElement,
              };
            })
            .filter((current, index, self) => {
              return self.findIndex((element) => element.src === current.src) == index;
            });

      const onkeydown = (e: KeyboardEvent) => {
        const self = e.currentTarget;

        if (e.altKey || e.ctrlKey) {
          return;
        }

        if (self instanceof HTMLButtonElement) {
          const buttons = [
            ...(self.closest('ul')?.querySelectorAll<HTMLButtonElement>('button') ?? []),
          ];
          const index = buttons.indexOf(self);

          if (e.key.startsWith('Arrow')) {
            e.preventDefault();
          }

          switch (e.key) {
            case 'Home':
              buttons[0].click();
              break;
            case 'End':
              buttons[buttons.length - 1].click();
              break;
            case 'ArrowRight':
              (buttons[index + 1] || buttons[0]).click();
              break;
            case 'ArrowLeft':
              (buttons[index - 1] || buttons[buttons.length - 1]).click();
              break;
            case 'ArrowUp': {
              (
                buttons[index - IMAGE_LIST_COLS] ||
                buttons[Math.floor(buttons.length / IMAGE_LIST_COLS) * IMAGE_LIST_COLS + index] ||
                buttons[
                  Math.floor(
                    (buttons.length - (buttons.length % IMAGE_LIST_COLS)) / IMAGE_LIST_COLS,
                  ) *
                    IMAGE_LIST_COLS +
                    index -
                    IMAGE_LIST_COLS
                ]
              ).click();
              break;
            }
            case 'ArrowDown': {
              const rest = index % IMAGE_LIST_COLS;
              (buttons[index + IMAGE_LIST_COLS] || buttons[rest] || buttons[0]).click();
              break;
            }
          }
        }
      };
      const listItems = images.flatMap(({ src, alt, isError, originalElement }, index, self) => {
        if (isError) {
          return [];
        }

        const listItem = document.createElement('li');
        const button = document.createElement('button');

        button.tabIndex = -1;
        button.addEventListener('click', () => {
          if (originalElement instanceof HTMLImageElement) {
            currentImageElement = originalElement;
          } else {
            const svg = convertedSvgMap.get(originalElement);

            if (svg) {
              currentImageElement = svg;
            }
          }

          if (!currentImageElement) {
            return;
          }

          if (button.getAttribute('aria-current') !== 'true') {
            showDialog({ noCreateImageList: true });
          }
        });
        button.addEventListener('keydown', onkeydown);

        listItem.className = 'image-list-item';
        button.className = 'image-list-item-button';

        if (currentImageElement?.src === src) {
          button.setAttribute('aria-current', 'true');
          button.tabIndex = 0;
        }

        button.insertAdjacentHTML('afterbegin', `<img />`);

        const img = button.firstElementChild as HTMLImageElement;

        img.src = src;
        img.onerror = () => {
          listItem.remove();
          self[index].isError = true;
        };

        // alt がない時、image_list_no_alt を alt に指定するとここの alt が拾われてしまうため、aria-label を使用する
        if (alt) {
          img.alt = alt;
        } else {
          img.setAttribute('aria-label', chrome.i18n.getMessage('image_list_no_alt'));
        }

        listItem.append(button);

        return listItem;
      });

      fragment.append(...listItems);
      formControls.imageList.textContent = '';
      formControls.imageList.append(fragment);

      const buttons = [...formControls.imageList.querySelectorAll('button')];
      const current = buttons.find((button) => button.getAttribute('aria-current') === 'true');
      const currentIndex = current ? buttons.indexOf(current) : -1;
      const viewCurrentIndex = () => {
        formControls.imageListInfo.textContent = `${currentIndex + 1} / ${buttons.length}`;
      };

      if (noRecreate) {
        viewCurrentIndex();

        if (current) {
          // scrollIntoView() だと常に上辺か下辺に張り付くため、自前で実装
          const imageListRect = formControls.imageList.getBoundingClientRect();
          const targetRect = current.getBoundingClientRect();
          const isNotVisibleTop = targetRect.top < imageListRect.top - IMAGE_LIST_GAP;
          const isNotVisibleBottom = imageListRect.bottom < targetRect.top + IMAGE_LIST_GAP;

          if (isNotVisibleTop) {
            setTimeout(() => {
              formControls.imageList.scrollBy(
                0,
                targetRect.top - imageListRect.top - IMAGE_LIST_GAP,
              );
            }, 0);
          } else if (isNotVisibleBottom) {
            setTimeout(() => {
              formControls.imageList.scrollBy(
                0,
                targetRect.bottom - imageListRect.bottom + IMAGE_LIST_GAP,
              );
            }, 0);
          }
        }

        current?.focus();
      } else {
        imagesCache = images;
        formControls.imageList.classList.add('invisible');

        setTimeout(() => {
          formControls.imageList.classList.remove('invisible');
          viewCurrentIndex();
          current?.scrollIntoView(false);
        }, 300);
      }
    };
  })();

  dialog.append(canvas);
  dialog.append(details);
  canvas.insertAdjacentHTML('afterend', SPINNER);
  shadowRoot.appendChild(style);
  shadowRoot.appendChild(dialog);
  document.body.appendChild(imageViewer);

  window.addEventListener('load', () => {
    // for front-end frameworks
    if (!document.body.contains(imageViewer)) {
      document.body.appendChild(imageViewer);
    }
  });

  resizeSupport();

  const getFileSize = (image: HTMLImageElement) => {
    return new Promise<void>((done) => {
      const isSVG = image.src.startsWith('data:image/svg+xml');

      if (isSVG) {
        const size = new Blob([image.src]).size;

        setImageData(image, {
          fileSize: size ? `${size} byte` : chrome.i18n.getMessage('error_fileSize'),
          fileType: 'image/svg+xml (in HTML)',
        });

        done();
        return;
      }

      const { protocol } = new URL(image.src);

      fetch(image.src.replace(protocol, location.protocol), { method: 'HEAD' })
        .then(({ headers }) => {
          const size = headers.get('Content-Length');
          const type = headers.get('Content-Type');

          setImageData(image, {
            fileSize: size ? `${size} byte` : chrome.i18n.getMessage('error_fileSize'),
            fileType: type ?? chrome.i18n.getMessage('error_fileType'),
          });
        })
        .catch(() => {
          setImageData(image, {
            fileSize: chrome.i18n.getMessage('error_fileSize'),
            fileType: chrome.i18n.getMessage('error_fileType'),
          });
        })
        .finally(() => {
          done();
        });
    });
  };

  return {
    imageViewer,
    dialog,
    showDialog: async (option?: { noCreateImageList?: boolean }) => {
      const noCreateImageList = option?.noCreateImageList ?? false;

      if (!dialog.open) {
        dialog.showModal();
      }

      return await new Promise<void>(async (resolve) => {
        if (!currentImageElement) {
          return;
        }

        const imageData = getImageData(currentImageElement);
        const initialScale = (() => {
          if (
            !('clonedImage' in imageData) ||
            !(imageData.clonedImage instanceof HTMLImageElement)
          ) {
            return null;
          }

          return getImageData(imageData.clonedImage).scale;
        })();

        if (!imageData.isInDialog) {
          if (imageData.clonedImage === null) {
            dialog.setAttribute('aria-busy', 'true');
            spaceElement.classList.add('loading');

            const clonedImage = new Image();

            clonedImage.alt = currentImageElement.alt;
            clonedImage.src = currentImageElement.src;
            clonedImage.width = currentImageElement.width;
            clonedImage.height = currentImageElement.height;

            const isError = await new Promise<boolean>((done) => {
              clonedImage.onload = () => done(false);
              clonedImage.onerror = () => done(true);
            });

            if (isError) {
              console.log('Chrome Extension Image Viewer: 404 ERROR', currentImageElement);
              dialog.removeAttribute('aria-busy');
              spaceElement.classList.remove('loading');
              return;
            }

            // ダイアログ用の画像は別で管理する
            setImageData(clonedImage, {
              ...imageData,
              isInDialog: true,
              origin: currentImageElement,
            });

            setImageData(currentImageElement, {
              clonedImage,
            });

            currentImageElement = clonedImage;

            // 容量の解決
            await getFileSize(clonedImage).finally(() => {
              dialog.removeAttribute('aria-busy');
              spaceElement.classList.remove('loading');
              zoomAndScrollInit(clonedImage, imageData.scale);
            });
          } else {
            currentImageElement = imageData.clonedImage;
            resolve();
          }
        }

        spaceElement.textContent = '';
        spaceElement.append(currentImageElement);

        createImageList(noCreateImageList);

        if (dialog.open) {
          formControls.imageList.querySelector<HTMLButtonElement>('[aria-current="true"]')?.focus();
        } else {
          dialog.showModal();
        }

        zoomAndScrollInit(currentImageElement, initialScale || 'init');
        setInputValues(imageData);
        resolve();
      });
    },
    dialogContains,
    getImageData,
    setImageData,
  };
})();

const resolveTarget = (target: EventTarget | null) => {
  const getElement = () => {
    if (target === null || (!(target instanceof HTMLElement) && !(target instanceof SVGElement))) {
      return null;
    }

    if (currentImageElement instanceof HTMLImageElement && target === imageViewer) {
      return currentImageElement;
    }

    if (target instanceof HTMLImageElement || target instanceof SVGElement) {
      const svg = target.closest('svg');

      if (svg) {
        return svg;
      }

      return target;
    }

    const childrenImages = target.querySelectorAll('img, svg');

    if (childrenImages.length === 1) {
      return childrenImages[0];
    }

    const imagesFromParent = target.parentElement?.querySelectorAll('img, svg');

    if (imagesFromParent?.length === 1) {
      return imagesFromParent[0];
    }

    const focusableOrSemanticContextsImages = target
      .closest('a, button, [tabindex], [aria-label], [role="button"], [role="link"]')
      ?.querySelectorAll('img, svg');

    if (focusableOrSemanticContextsImages?.length === 1) {
      return focusableOrSemanticContextsImages[0];
    }

    const { backgroundImage } = getComputedStyle(target);

    if (backgroundImage === 'none') {
      return null;
    }

    const pseudoImage = new Image();

    pseudoImage.src = backgroundImage.replace(/url\("(.*)"\)/, '$1');

    return pseudoImage;
  };

  const img = getElement();

  if (img instanceof HTMLImageElement) {
    return img;
  }
  if (img instanceof SVGElement) {
    return convertSVGToImg(img);
  }

  return null;
};

chrome.runtime.onMessage.addListener(({ menuItemId }, _, sendResponse) => {
  const targetElement = currentImageElement;

  sendResponse(true);

  if (menuItemId === 'reset-all') {
    const nodeList = [
      ...(targetElement ? [targetElement] : []),
      ...document.querySelectorAll<HTMLImageElement>('[data-image-viewer-default-style]'),
    ];

    nodeList.forEach((image) => {
      const imageData = getImageData(image);

      setImageData(image, {
        ...defaultState,
        oldScale: imageData.oldScale,
        fileSize: imageData.fileSize,
      });

      if (!imageData.isInDialog && imageData.clonedImage) {
        const clonedImageData = getImageData(imageData.clonedImage);

        setImageData(imageData.clonedImage, {
          ...defaultState,
          isInDialog: true,
          oldScale: clonedImageData.oldScale,
          fileSize: clonedImageData.fileSize,
        });
      }

      if (typeof image.dataset.imageViewerDefaultStyle === 'string') {
        image.setAttribute('style', image.dataset.imageViewerDefaultStyle);
      }
    });

    return true;
  }

  if (!targetElement) {
    return true;
  }

  const imageData = getImageData(targetElement);
  const { isInDialog } = imageData;

  if (menuItemId.endsWith('%')) {
    setImageData(targetElement, {
      scale: Number(menuItemId.replace(/[^0-9.]/g, '')),
    });
  } else if (menuItemId.endsWith('deg')) {
    setImageData(targetElement, {
      rotate: Number(menuItemId.replace(/[^0-9.]/g, '')),
    });
  } else {
    switch (menuItemId) {
      case 'reset': {
        if (isInDialog) {
          targetElement.removeAttribute('style');

          setImageData(targetElement, {
            ...defaultState,
            isInDialog,
            oldScale: imageData.oldScale,
            fileSize: imageData.fileSize,
          });
        } else {
          if (typeof targetElement.dataset.imageViewerDefaultStyle === 'string') {
            targetElement.setAttribute('style', targetElement.dataset.imageViewerDefaultStyle);
          }
        }

        break;
      }

      case 'reverse':
        setImageData(targetElement, {
          reverse: !imageData.reverse,
        });

        break;

      case 'dialog': {
        const show = async () => {
          await showDialog();
        };

        show();

        break;
      }
    }
  }

  return true;
});

window.addEventListener('contextmenu', ({ target }) => {
  const targetImage = resolveTarget(target);

  if (!(targetImage instanceof HTMLImageElement)) {
    currentImageElement = null;
    console.log('Chrome Extension Image Viewer: No image');

    return;
  }

  if (targetImage) {
    const isInDialog = dialogContains(targetImage);

    if (!isInDialog) {
      if (typeof targetImage.dataset.imageViewerDefaultStyle !== 'string') {
        targetImage.dataset.imageViewerDefaultStyle = targetImage.getAttribute('style') || '';
      }

      currentImageElement = targetImage;
    }
  }
});
