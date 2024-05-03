<template>
  <div class="svg-container">
    <svg class="ft-green-tick" xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 48 48" aria-hidden="true">
      <circle class="circle" fill="#5bb543" cx="24" cy="24" r="22"/>
      <path class="tick" fill="none" stroke="#FFF" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" d="M14 27l5.917 4.917L34 17"/>
    </svg>
  </div>
</template>

<style scoped>


@supports (animation: grow .2s cubic-bezier(.25, .25, .25, 1) forwards) {
  .tick {
    stroke-opacity: 0;
    stroke-dasharray: 29px;
    stroke-dashoffset: 29px;
    animation: draw .2s cubic-bezier(.25, .25, .25, 1) forwards;
    animation-delay: .3s
  }

  .circle {
    fill-opacity: 0;
    stroke: #219a00;
    stroke-width: 16px;
    transform-origin: center;
    transform: scale(0);
    animation: grow 0.5s cubic-bezier(.25, .25, .25, 1.25) forwards;
  }
}

@keyframes grow {
  60% {
    transform: scale(.8);
    stroke-width: 4px;
    fill-opacity: 0;
  }
  100% {
    transform: scale(.9);
    stroke-width: 8px;
    fill-opacity: 1;
    fill: #219a00;
  }
}

@keyframes draw {
  0%, 100% {
    stroke-opacity: 1;
  }
  100% {
    stroke-dashoffset: 0;
  }
}




</style>