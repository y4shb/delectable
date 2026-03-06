from django.urls import path

from . import views

urlpatterns = [
    path("plans/", views.CreateDinnerPlanView.as_view(), name="dinner-plan-list-create"),
    path("plans/join/", views.JoinDinnerPlanView.as_view(), name="dinner-plan-join"),
    path("plans/<uuid:plan_id>/", views.DinnerPlanDetailView.as_view(), name="dinner-plan-detail"),
    path("plans/<uuid:plan_id>/votes/", views.SubmitVotesView.as_view(), name="dinner-plan-votes"),
    path("plans/<uuid:plan_id>/result/", views.DinnerPlanResultView.as_view(), name="dinner-plan-result"),
]
