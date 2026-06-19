<script setup lang="ts">
import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarShortcut,
  MenubarSeparator,
} from '@/components/ui/menubar'
import { Button } from '@/components/ui/button'

import { menuConfig } from './menu.data'
import { windowConfig } from './menu.cef'
</script>

<template>
  <div class="flex justify-between items-center border-b">
    <!-- Editor Menu -->
    <Menubar class="border-none">
      <MenubarMenu v-for="menu in menuConfig" :key="menu.trigger">
        <MenubarTrigger class="cursor-pointer rounded-none">{{ menu.trigger }}</MenubarTrigger>
        <MenubarContent>
          <template v-for="(item, i) in menu.items" :key="i">
            <MenubarSeparator v-if="item.type === 'separator'" />
            <MenubarItem v-else @click="item.action?.()">
              {{ item.label }}
              <MenubarShortcut v-if="item.shortcut">
                {{ item.shortcut }}
              </MenubarShortcut>
            </MenubarItem>
          </template>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
    <!-- Window Controls -->
    <div class="flex gap-3">
      <Button class="cursor-pointer" variant="ghost" size="icon"> Login </Button>
      <div>
        <Button
          variant="ghost"
          class="cursor-pointer rounded-none"
          v-for="ctrl in windowConfig"
          :key="ctrl.id"
          :class="ctrl.color"
          @click="sendWindowCommand(ctrl.method)"
        >
          <component :is="ctrl.symbol" />
        </Button>
      </div>
    </div>
  </div>
</template>
