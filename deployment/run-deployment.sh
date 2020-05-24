#!/usr/bin/env bash
. ./unimelb-comp90024-2020-grp-67-openrc.sh; ansible-playbook -i hosts -vvv --ask-become-pass deployment.yaml
