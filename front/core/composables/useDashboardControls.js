import { addMonths } from 'date-fns'
import { animateOnNext, animateOnPrevious } from '~/core/utils/AnimationUtils.js'
import DateUtils from '~/core/utils/DateUtils.js'
import { useDashboardStore } from '~/core/stores/dashboardStore'
import { useBudgetStore } from '~/core/stores/budgetStore'

export const useDashboardControls = () => {
    const dashboardStore = useDashboardStore()
    const budgetStore = useBudgetStore()
    const showDropdown = ref(false)

    const rangeTitle = computed(() => {
        let date1 = DateUtils.dateToUI(dashboardStore.dashboardDateStart)
        let date2 = DateUtils.dateToUI(dashboardStore.dashboardDateEnd)
        return `${date1} - ${date2}`
    })

    const onNextMonth = () => {
        dashboardStore.month = addMonths(dashboardStore.month, 1)
        animateOnNext()
    }

    const onPreviousMonth = () => {
        dashboardStore.month = addMonths(dashboardStore.month, -1)
        animateOnPrevious()
    }

    const onChooseMonth = () => {
        showDropdown.value = true
    }

    watch(
        () => dashboardStore.month,
        (newVal, oldVal) => {
            if (!oldVal) return
            dashboardStore.fetchDashboardAccounts()
            dashboardStore.fetchTransactionsForInterval()
            budgetStore.fetchBudgetLimits()
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
