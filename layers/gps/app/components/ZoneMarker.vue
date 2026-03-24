<script setup lang="ts">

const props = defineProps<{
  coords: [number, number] | null
  radius: number
  color: string
}>()

/*Emite eventos de actualización de radio , guardar geocerca y cancelar la geocerca */
const emit = defineEmits(['update:radius', 'save', 'cancel'])

/*Estados reactivos de la card de geocerca */
const zoneName = ref('')
const internalRadius = ref(props.radius)
const internalColor = ref(props.color?.replace('#', '') || '005a94')

/*Disparador de evento de guardado de geocerca*/
const onSave = () => {
  emit('save', {
    nombre: zoneName.value,
    tipo: 'circle',
    radius: Number(internalRadius.value),
    color: `#${internalColor.value.replace('#', '')}`,
    coords: props.coords
  })
}

/*Monitoreo continuo ante el cambio de radio */
watch(() => props.radius, val => (internalRadius.value = val))

</script>

<template>
  <LCircle
    v-if="coords"
    :lat-lng="coords"
    :radius="radius"
    :color="`#${internalColor}`"
    :dash-array="'10, 10'"
    :fill-opacity="0.3"
  >
    <LPopup :options="{ closeButton: false, minWidth: 220 }">
      <div class="p-3 flex flex-col gap-3">
        <span class="font-bold text-primary text-sm block border-b pb-1">Configurar Zona</span>

        <div class="flex flex-col gap-1">
          <label class="text-[10px] uppercase font-bold text-primary">Nombre y Color</label>
          <div class="flex gap-2 items-center">
            <UInput
              v-model="internalColor"
              type="color"
              class="w-12 h-8 p-0 overflow-hidden"
            />
            <UInput
              v-model="zoneName"
              placeholder="Nombre..."
              size="xs"
              class="flex-1"
            />
          </div>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-[10px] uppercase font-bold text-primary">Radio (m)</label>
          <UInput
            v-model="internalRadius"
            type="number"
            size="xs"
            trailing-icon="i-lucide-ruler"
            @update:model-value="$emit('update:radius', Number($event))"
          />
        </div>

        <div class="flex gap-2 pt-1">
          <UButton
            icon="i-lucide-x"
            variant="ghost"
            class="flex-1 justify-center"
            @click="$emit('cancel')"
          />
          <UButton
            label="Guardar"
            icon="i-lucide-check"
            color="primary"
            class="flex-[2] justify-center"
            @click="onSave"
          />
        </div>
      </div>
    </LPopup>
  </LCircle>
</template>
