<script setup lang="ts">
import { ref, onUpdated, onBeforeUpdate } from 'vue';
import { Counter } from '../lib/counter';
import { useReactive, create } from '../lib/starbeam';
import Reactive from './Reactive.tsx';

defineProps<{ msg: string }>();

const counter = create(Counter);
</script>

<template>
  <h2>In SFC</h2>
  <div>
    <p>msg: {{ msg }}</p>
    <button @click="counter.increment">{{ counter.count }}</button>
  </div>
</template>
