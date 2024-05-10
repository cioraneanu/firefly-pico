let title = ref('')
let subtitle = ref('')
let titleIcon = ref(null)
let leftText = ref('')
let onBackButton = () => {}
let backRoute = ref(null)

// Maybe implement them later...
// let rightButtons = ref([])
// let onRightButton = () => {}

export function useToolbar() {
  const init = ({
    title: _title = null,
    subtitle: _subtitle = null,
    titleIcon: _titleIcon = null,
    leftText: _leftText = null,
    backRoute: _backRoute = null,
    // rightButtons: _rightButtons = [],
    // onRightButton: _onRightButton = () => {}
  } = {}) => {
    if (_title) {
      if (isRef(_title)) {
        watch(
          _title,
          (newValue) => {
            title.value = newValue
          },
          { immediate: true },
        )
      } else {
        title.value = _title
      }
    }

    if (isRef(_subtitle)) {
      watch(
        _subtitle,
        (newValue) => {
          subtitle.value = newValue
        },
        { immediate: true },
      )
    } else {
      subtitle.value = _subtitle
    }

    titleIcon.value = _titleIcon
    leftText.value = _leftText
    backRoute.value = _backRoute

    onBackButton = !_backRoute
      ? () => {}
      : async () => {
          await navigateTo(_backRoute)
        }

    // rightButtons.value = _rightButtons

    // if (_onRightButton) {
    //   onRightButton = _onRightButton
    // }
  }

  const onBack = () => {
    if (onBackButton && onBackButton instanceof Function) {
      onBackButton()
    }
  }

  return {
    init,
    title,
    subtitle,
    leftText,
    onBack,
    backRoute,
    titleIcon,
  }
}
