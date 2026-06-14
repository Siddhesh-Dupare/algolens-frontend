<script setup lang="ts">
import Menu from '@/components/menubar/MenuBar.vue'
import BottomBar from '@/components/bottombar/BottomBar.vue'
</script>

<template>
  <div class="flex flex-col h-screen">
    <Menu />
    <main class="flex-1 overflow-auto"></main>
    <BottomBar />
  </div>
</template>

<style scoped></style>
