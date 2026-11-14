// Owner-site catalog. Live super-admin permission was not re-checked for this
// build, so every row stays permission_verified: false and no tool calls the site.
// Domains are the public names already written in the site-agents spec or the
// owner's request. Where those sources disagree, both strings are kept.

const UNVERIFIED = 'Live super-admin permission was not re-checked. Writes stay behind approval and are not dispatched.'

export const OWNER_SITES = [
  site('sssbrain', 'SSS Brain', ['sssbrain.live'], 'Named by the owner. Not re-verified.'),
  site('swadesoul', 'Swade Soul', ['swadesoul.com'], 'Named by the owner. Not re-verified.'),
  site('oathloom', 'OATHLOOM', [], 'Named by the owner. No single registry domain was confirmed in this build.'),
  site('maestro-radio', 'Maestro Radio', ['themaestroradio.com', 'maestroradio.com'], 'Spec snapshot recorded maestroradio.com. A later SWADEBASE note recorded themaestroradio.com. Neither permission was re-checked.'),
  site('swade-radio', 'SWADE Radio', [], 'Named by the owner. Domain was not confirmed in this build.'),
  site('resinglab', 'ReSingLab', ['resinglab.com'], 'Spec lists resinglab. The public host resinglab.com was not re-checked.'),
  site('teachvirt', 'TeachVirt', ['teachvirt.courses', 'teachvert.courses'], 'Spec snapshot says the registry domain teachvert.courses disagrees with teachvirt.courses. Not re-checked.'),
  site('virtteach', 'VirtTeach', [], 'Named by the owner. Domain was not confirmed in this build.'),
  site('my-distribution', 'My Distribution', [], 'Named by the owner. Domain was not confirmed in this build.'),
  site('blacktales', 'Black Tales', [], 'Named by the owner. Domain was not confirmed in this build.'),
  site('videosaywhat', 'VideoSayWhat', ['videosaywhat.com'], 'Spec snapshot lists videosaywhat.com. Permission was not re-checked.'),
  site('abagale', 'ABAGALE', ['abagale.live'], 'Spec snapshot lists abagale.live. Permission was not re-checked.'),
  site('tokencsi', 'TokenCSI', ['tokencsi.com'], 'Spec snapshot lists tokencsi.com. Permission was not re-checked.'),
  site('makemycoin', 'MakeMyCoin', ['makemycoin.live'], 'Spec snapshot lists makemycoin.live and says its database is not on SWADEBASE. Permission was not re-checked.'),
]

function site(slug, name, domains, note) {
  return {
    slug,
    name,
    domains,
    permission_verified: false,
    verification_note: `${note} ${UNVERIFIED}`,
    sign_in_methods: ['google', 'email'],
    source: 'catalog',
  }
}

export function ownerSite(slug) {
  return OWNER_SITES.find((item) => item.slug === slug) || null
}
