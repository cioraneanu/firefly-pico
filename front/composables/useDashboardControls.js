import { addMonths } from 'date-fns'
import { animateOnNext, animateOnPrevious } from '~/utils/AnimationUtils.js'
import DateUtils from '~/utils/DateUtils.js'

export const useDashboardControls = () => {
    const dataStore = useDataStore()
    const showDropdown = ref(false)

    const rangeTitle = computed(() => {
        let date1 = DateUtils.dateToUI(dataStore.dashboardDateStart)
        let date2 = DateUtils.dateToUI(dataStore.dashboardDateEnd)
        return `${date1} - ${date2}`
    })

    const onNextMonth = () => {
        dataStore.dashboard.month = addMonths(dataStore.dashboard.month, 1)
        animateOnNext()
    }

    const onPreviousMonth = () => {
        dataStore.dashboard.month = addMonths(dataStore.dashboard.month, -1)
        animateOnPrevious()
    }

    const onChooseMonth = () => {
        showDropdown.value = true
    }

    watch(
        () => dataStore.dashboard.month,
        () => {
            dataStore.fetchDashboardTransactionsForInterval()
        }
    )

    return {
        showDropdown,
        rangeTitle,
        onNextMonth,
        onPreviousMonth,
        onChooseMonth
    }
}
