<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useFields } from '#layers/gps/app/composables/useFields'
import type { Field } from '~~/shared/types/db'

const { fields, fetchFields, updateField } = useFields()

const rootFields = computed(() => {
  return [...fields.value]
    .filter(field => field.parentId == null)
    .sort((a, b) => a.nombre.localeCompare(b.nombre))
})

const childrenByParent = computed(() => {
  const map = new Map<number, Field[]>()
  for (const field of fields.value) {
    if (field.parentId == null) continue
    const list = map.get(field.parentId) ?? []
    list.push(field)
    map.set(field.parentId, list)
  }
  for (const [key, list] of map.entries()) {
    list.sort((a, b) => a.nombre.localeCompare(b.nombre))
    map.set(key, list)
  }
  return map
})

const getChildren = (fieldId: number) => {
  return childrenByParent.value.get(fieldId) ?? []
}

const saveColor = async (field: Field) => {
  await updateField(field.id, { color: field.color })
}

onMounted(async () => {
  await fetchFields()
})
</script>

<template>
  <div class="w-full h-screen flex flex-col p-10 font-sans text-slate-900 overflow-hidden">
    <header class="flex items-center justify-between mb-8">
      <div>
        <h1 class="font-serif text-4xl font-bold tracking-tighter text-slate-950 leading-none">Campos por Jerarquia</h1>
        <nav class="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-3">
          <span>Flota Agricola</span>
          <UIcon name="i-lucide-chevron-right" class="w-3 h-3 opacity-30" />
          <span class="text-slate-600">Campos</span>
        </nav>
      </div>
    </header>

    <div class="bg-white border border-slate-200 shadow-[0_12px_40px_rgba(0,0,0,0.03)] overflow-hidden flex-1 flex flex-col">
      <div class="px-10 py-6 border-b border-slate-100 flex items-center justify-between">
        <div>
          <p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Jerarquia</p>
          <h2 class="text-lg font-bold text-slate-950">Padres y Campos hijos</h2>
        </div>
        <span class="text-[10px] font-black uppercase tracking-widest text-slate-400">
          {{ fields.length }} campos
        </span>
      </div>

      <div class="overflow-auto flex-1 p-10 space-y-6">
        <div
          v-for="parent in rootFields"
          :key="parent.id"
          class="border border-slate-200 bg-white shadow-sm"
        >
          <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span
                class="w-3 h-3 rounded-full border border-slate-300"
                :style="{ backgroundColor: parent.color || '#3b82f6' }"
              ></span>
              <div>
                <p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Padre</p>
                <h3 class="text-lg font-bold text-slate-950">{{ parent.nombre }}</h3>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <UInput
                v-model="parent.color"
                type="color"
                class="w-10 h-8 p-0 overflow-hidden"
              />
              <UButton
                size="xs"
                label="Guardar color"
                icon="i-lucide-save"
                color="neutral"
                variant="soft"
                @click="saveColor(parent)"
              />
            </div>
          </div>

          <div class="px-6 py-4">
            <p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">
              Campos hijos ({{ getChildren(parent.id).length }})
            </p>
            <div v-if="!getChildren(parent.id).length" class="text-sm text-slate-400">
              Sin campos hijos.
            </div>
            <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <div
                v-for="child in getChildren(parent.id)"
                :key="child.id"
                class="border border-slate-200/80 bg-slate-50/40 p-4 flex items-center justify-between"
              >
                <div class="flex items-center gap-3">
                  <span
                    class="w-3 h-3 rounded-full border border-slate-300"
                    :style="{ backgroundColor: child.color || '#3b82f6' }"
                  ></span>
                  <div>
                    <p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Hijo</p>
                    <p class="text-sm font-semibold text-slate-900">{{ child.nombre }}</p>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <UInput
                    v-model="child.color"
                    type="color"
                    class="w-10 h-8 p-0 overflow-hidden"
                  />
                  <UButton
                    size="xs"
                    icon="i-lucide-save"
                    color="neutral"
                    variant="ghost"
                    @click="saveColor(child)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
