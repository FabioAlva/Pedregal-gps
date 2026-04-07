export const useFleetStore = defineStore('fleet', () => {
  const fleets = ref<Fleet[]>([])
  const isLoading = ref(false)

  const fetchFleets = async () => {
    if (fleets.value.length > 0) return
    isLoading.value = true
    try {
      fleets.value = await $fetch<Fleet[]>('/api/fleets')
    } finally {
      isLoading.value = false
    }
  }

  const addFleet = (newFleet: Fleet) => {
    fleets.value = [newFleet, ...fleets.value]
  }


const resetCache = () => { fleets.value = [] } // <-- AÑADE ESTO

  const updateFleetInStore = (updatedFleet: Fleet) => {
    const index = fleets.value.findIndex(f => f.id === updatedFleet.id)
    if (index !== -1) {
      const newArray = [...fleets.value]
      newArray[index] = updatedFleet
      fleets.value = newArray
    }
  }

  const deleteFleetInStore = (id: number | string) => {
    fleets.value = fleets.value.filter(f => f.id !== id)
  }

  return { fleets, isLoading, fetchFleets, addFleet, updateFleetInStore, deleteFleetInStore,resetCache }
})