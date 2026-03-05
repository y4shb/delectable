from django.urls import path

from . import views

urlpatterns = [
    # Invite/Referral
    path("sharing/invite-code/", views.MyInviteCodeView.as_view(), name="invite-code"),
    path("sharing/referrals/", views.ReferralListView.as_view(), name="referrals"),
    path("sharing/referrals/stats/", views.ReferralStatsView.as_view(), name="referral-stats"),
    path("sharing/referrals/rewards/", views.ReferralRewardListView.as_view(), name="referral-rewards"),
    path("sharing/referrals/rewards/<uuid:id>/claim/", views.ClaimRewardView.as_view(), name="claim-reward"),

    # Playlist Collaboration
    path("playlists/<uuid:playlist_id>/collaborators/", views.PlaylistCollaboratorListView.as_view(), name="playlist-collaborators"),
    path("playlists/<uuid:playlist_id>/collaborators/<uuid:user_id>/", views.RemoveCollaboratorView.as_view(), name="remove-collaborator"),
    path("playlists/<uuid:playlist_id>/activity/", views.PlaylistActivityListView.as_view(), name="playlist-activity"),
    path("playlists/<uuid:id>/fork/", views.ForkPlaylistView.as_view(), name="fork-playlist"),

    # Challenges
    path("challenges/", views.ChallengeListView.as_view(), name="challenges"),
    path("challenges/<uuid:id>/", views.ChallengeDetailView.as_view(), name="challenge-detail"),
    path("challenges/<uuid:id>/join/", views.JoinChallengeView.as_view(), name="join-challenge"),
    path("challenges/<uuid:id>/leaderboard/", views.ChallengeLeaderboardView.as_view(), name="challenge-leaderboard"),
    path("challenges/<uuid:id>/submit/", views.SubmitChallengeReviewView.as_view(), name="challenge-submit"),

    # Share Cards
    path("sharing/card/", views.GenerateShareCardView.as_view(), name="generate-share-card"),

    # Deep Links
    path("sharing/deeplink/", views.RecordDeepLinkView.as_view(), name="record-deeplink"),
    path("sharing/deeplink/resolve/", views.ResolveDeepLinkView.as_view(), name="resolve-deeplink"),
]
