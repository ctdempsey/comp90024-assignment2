#!/usr/bin/bash
. ./unimelb-comp90024-2020-grp-67-openrc.sh; ansible-playbook -vvv --ask-become-pass nectar-instances.yaml
