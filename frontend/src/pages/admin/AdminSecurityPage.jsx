import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { adminNav } from '../../lib/adminNav.js'
import { queryKeys } from '../../lib/queryKeys.js'
import { CACHE_TIERS } from '../../lib/queryOptions.js'
import { getMe } from '../../api/userApi.js'
import { postMfaDisable, postMfaEnable, postMfaSetup } from '../../api/authMfaApi.js'
import { getApiErrorMessage } from '../../utils/getApiErrorMessage.js'
import { PageHeader } from '../../components/ui/PageHeader.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Input } from '../../components/ui/Input.jsx'

function IconChevron({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
  )
}

export function AdminSecurityPage() {
  const queryClient = useQueryClient()
  const [setup, setSetup] = useState(null)
  const [enableCode, setEnableCode] = useState('')
  const [disablePassword, setDisablePassword] = useState('')

  const meQuery = useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: () => getMe(),
    staleTime: CACHE_TIERS.auth.staleTime,
    gcTime: CACHE_TIERS.auth.gcTime,
  })

  const me = meQuery.data

  const setupMutation = useMutation({
    mutationFn: postMfaSetup,
    onSuccess: (payload) => {
      setSetup(payload)
      setEnableCode('')
      toast.message('Copy the secret or open the otpauth link on your phone, then enter a code to confirm.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not start authenticator setup.')),
  })

  const enableMutation = useMutation({
    mutationFn: () => postMfaEnable({ secret: setup.secret, code: enableCode.replace(/\s/g, '') }),
    onSuccess: async () => {
      setSetup(null)
      setEnableCode('')
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() })
      toast.success('Authenticator enabled. You will enter a code at each sign-in.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Invalid code or setup expired — generate a new secret.')),
  })

  const disableMutation = useMutation({
    mutationFn: () => postMfaDisable({ password: disablePassword }),
    onSuccess: async () => {
      setDisablePassword('')
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() })
      toast.success('Authenticator disabled.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not disable authenticator.')),
  })

  return (
    <section className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <Link
          to="/admin/dashboard"
          className="inline-flex items-center gap-1 text-sm font-medium text-teal-700 hover:text-[#0C5F5A] dark:text-teal-400"
        >
          <span aria-hidden>←</span> Admin overview
        </Link>
        <PageHeader
          className="mt-4"
          title="Security"
          description="Protect admin access with an authenticator app (TOTP). Required when ADMIN_MFA_REQUIRED is set in production."
        />
      </div>

      {me?.adminMfaRequired && !me?.mfaEnabled ? (
        <div
          className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100"
          role="status"
        >
          Your environment requires administrators to enroll an authenticator before using other admin tools.
        </div>
      ) : null}

      <Card padding="default" className="space-y-4">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Authenticator (MFA)</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Status:{' '}
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {me?.mfaEnabled ? 'Enabled' : 'Not enabled'}
          </span>
        </p>

        {!me?.mfaEnabled ? (
          <div className="space-y-4">
            {!setup ? (
              <Button type="button" variant="gradient" onClick={() => setupMutation.mutate()} loading={setupMutation.isPending}>
                Generate setup secret
              </Button>
            ) : (
              <>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Add this account in Google Authenticator, 1Password, Authy, etc. This secret is shown once.
                </p>
                <div className="rounded-lg bg-gray-100 p-3 font-mono text-xs break-all dark:bg-gray-900">{setup.secret}</div>
                {setup.otpauthUrl ? (
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Mobile:</span>{' '}
                    <a href={setup.otpauthUrl} className="text-teal-700 underline dark:text-teal-400">
                      Open in authenticator app
                    </a>
                  </p>
                ) : null}
                <Input
                  id="mfa-enable-code"
                  label="6-digit code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={enableCode}
                  onChange={(e) => setEnableCode(e.target.value)}
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="gradient"
                    disabled={enableCode.replace(/\s/g, '').length < 6}
                    loading={enableMutation.isPending}
                    onClick={() => enableMutation.mutate()}
                  >
                    Confirm & enable
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setSetup(null)
                      setEnableCode('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              To disable, confirm your account password. You can re-enroll afterward.
            </p>
            <Input
              id="mfa-disable-password"
              label="Current password"
              type="password"
              autoComplete="current-password"
              value={disablePassword}
              onChange={(e) => setDisablePassword(e.target.value)}
            />
            <Button
              type="button"
              variant="secondary"
              className="border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/50"
              disabled={!disablePassword}
              loading={disableMutation.isPending}
              onClick={() => disableMutation.mutate()}
            >
              Disable authenticator
            </Button>
          </div>
        )}
      </Card>

      <div className="space-y-4">
        <PageHeader title="Admin sections" description="Jump to a management area." />
        <div className="grid gap-3 sm:grid-cols-2">
          {adminNav.map((item) => (
            <Link key={item.to} to={item.to} className="group block min-w-0">
              <Card
                as="article"
                hover
                padding="default"
                className="flex h-full items-center justify-between gap-3 ring-gray-100 dark:ring-gray-700"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white">{item.label}</p>
                  <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
                </div>
                <IconChevron className="h-5 w-5 shrink-0 text-gray-400 transition-transform group-hover:translate-x-0.5 dark:text-gray-500" />
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
