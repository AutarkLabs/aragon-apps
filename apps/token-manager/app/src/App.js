import React, { useEffect } from 'react'
import PropTypes from 'prop-types'
import BN from 'bn.js'
import {
  Badge,
  Button,
  GU,
  Header,
  IconPlus,
  SidePanel,
  SyncIndicator,
  textStyle,
  useLayout,
  useTheme,
  useThemeMode,
} from '@aragon/ui'
import { useAragonApi } from '@aragon/api-react'
import EmptyState from './screens/EmptyState'
import Holders from './screens/Holders'
import AssignVotePanelContent from './components/Panels/AssignVotePanelContent'
import AssignTokensIcon from './components/AssignTokensIcon'
import AppLayout from './components/AppLayout'
import { addressesEqual } from './web3-utils'
import { IdentityProvider } from './components/IdentityManager/IdentityManager'

const initialAssignTokensConfig = {
  mode: null,
  holderAddress: '',
}

class App extends React.PureComponent {
  static propTypes = {
    api: PropTypes.object,
    isSyncing: PropTypes.bool,
  }
  static defaultProps = {
    appStateReady: false,
    isSyncing: true,
    holders: [],
    connectedAccount: '',
    groupMode: false,
  }
  state = {
    assignTokensConfig: initialAssignTokensConfig,
    sidepanelOpened: false,
  }
  getHolderBalance = address => {
    const { holders } = this.props
    const holder = holders.find(holder =>
      addressesEqual(holder.address, address)
    )
    return holder ? holder.balance : new BN('0')
  }
  handleUpdateTokens = ({ amount, holder, mode }) => {
    const { api } = this.props

    // Don't care about responses
    if (mode === 'assign') {
      api.mint(holder, amount).toPromise()
    }
    if (mode === 'remove') {
      api.burn(holder, amount).toPromise()
    }

    this.handleSidepanelClose()
  }
  handleLaunchAssignTokensNoHolder = () => {
    this.handleLaunchAssignTokens('')
  }
  handleLaunchAssignTokens = address => {
    this.setState({
      assignTokensConfig: { mode: 'assign', holderAddress: address },
      sidepanelOpened: true,
    })
  }
  handleLaunchRemoveTokens = address => {
    this.setState({
      assignTokensConfig: { mode: 'remove', holderAddress: address },
      sidepanelOpened: true,
    })
  }
  handleSidepanelClose = () => {
    this.setState({ sidepanelOpened: false })
  }
  handleSidepanelTransitionEnd = open => {
    if (!open) {
      this.setState({ assignTokensConfig: initialAssignTokensConfig })
    }
  }
  handleResolveLocalIdentity = address => {
    return this.props.api.resolveAddressIdentity(address).toPromise()
  }
  handleShowLocalIdentityModal = address => {
    return this.props.api
      .requestAddressIdentityModification(address)
      .toPromise()
  }
  render() {
    const {
      appStateReady,
      connectedAccount,
      groupMode,
      holders,
      isSyncing,
      layoutName,
      maxAccountTokens,
      numData,
      requestMenu,
      theme,
      tokenAddress,
      tokenDecimalsBase,
      tokenName,
      tokenSupply,
      tokenSymbol,
      tokenTransfersEnabled,
    } = this.props

    const { assignTokensConfig, sidepanelOpened } = this.state

    return (
      <IdentityProvider
        onResolve={this.handleResolveLocalIdentity}
        onShowLocalIdentityModal={this.handleShowLocalIdentityModal}
      >
        <SyncIndicator visible={isSyncing} />

        <Header
          primary={
            <div
              css={`
                display: flex;
                align-items: center;
              `}
            >
              <h1
                css={`
                  ${textStyle(layoutName === 'small' ? 'title3' : 'title2')};
                  color: ${theme.content};
                  margin-right: ${1 * GU}px;
                `}
              >
                Tokens
              </h1>
              {tokenSymbol && <Badge.App>{tokenSymbol}</Badge.App>}
            </div>
          }
          secondary={
            <Button
              mode="strong"
              onClick={this.handleLaunchAssignTokensNoHolder}
              css={`
                ${layoutName === 'small'
                  ? `
                    width: ${5 * GU}px;
                    height: ${5 * GU}px;
                    min-width: 0;
                    padding: 0;
                  `
                  : ''}
              `}
            >
              {layoutName === 'small' ? <IconPlus /> : 'Add tokens'}
            </Button>
          }
        />

        {appStateReady && holders.length > 0 ? (
          <Holders
            holders={holders}
            groupMode={groupMode}
            maxAccountTokens={maxAccountTokens}
            tokenAddress={tokenAddress}
            tokenDecimalsBase={tokenDecimalsBase}
            tokenName={tokenName}
            tokenSupply={tokenSupply}
            tokenSymbol={tokenSymbol}
            tokenTransfersEnabled={tokenTransfersEnabled}
            userAccount={connectedAccount}
            onAssignTokens={this.handleLaunchAssignTokens}
            onRemoveTokens={this.handleLaunchRemoveTokens}
          />
        ) : (
          !isSyncing && (
            <EmptyState onActivate={this.handleLaunchAssignTokensNoHolder} />
          )
        )}

        <SidePanel
          title={
            assignTokensConfig.mode === 'assign'
              ? 'Add tokens'
              : 'Remove tokens'
          }
          opened={sidepanelOpened}
          onClose={this.handleSidepanelClose}
          onTransitionEnd={this.handleSidepanelTransitionEnd}
        >
          {appStateReady && (
            <AssignVotePanelContent
              opened={sidepanelOpened}
              tokenDecimals={numData.tokenDecimals}
              tokenDecimalsBase={tokenDecimalsBase}
              onUpdateTokens={this.handleUpdateTokens}
              getHolderBalance={this.getHolderBalance}
              maxAccountTokens={maxAccountTokens}
              {...assignTokensConfig}
            />
          )}
        </SidePanel>
      </IdentityProvider>
    )
  }
}

export default () => {
  const { api, appState, connectedAccount, requestMenu } = useAragonApi()
  const theme = useTheme()
  const themeMode = useThemeMode()
  const { layoutName } = useLayout()

  useEffect(() => {
    const fn = ({ data }) => {
      if (
        data &&
        data.from === 'wrapper' &&
        data.name === 'themeMode' &&
        data.value
      ) {
        themeMode.set(data.value)
      }
    }

    window.addEventListener('message', fn)
    return () => {
      window.removeEventListener('message', fn)
    }
  }, [])

  return (
    <App
      api={api}
      connectedAccount={connectedAccount}
      layoutName={layoutName}
      requestMenu={requestMenu}
      theme={theme}
      {...appState}
    />
  )
}
